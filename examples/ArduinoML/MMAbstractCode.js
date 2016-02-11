'use strict';

var _ = require('lodash');

var Class, Model, Enum;

var JSMF = require('jsmf-core');
(function() {
    Model = JSMF.Model;
    Class = JSMF.Class;
    Enum = JSMF.Enum;
}).call();


var App = Class.newInstance('App');

var IO = new Enum('IO', ['INPUT', 'OUTPUT']);
var Signal = new Enum('Signal', ['LOW', 'HIGH']);

var StructuralConcerns = Class.newInstance('StructuralConcerns');
App.setReference('structural', StructuralConcerns, 1);

var BrickAlias = Class.newInstance('BrickAlias', [], {name: String, pin: JSMF.Range(0,13)});
StructuralConcerns.setReference('alias', BrickAlias, -1);

var PinMode = Class.newInstance('PinMode', [], {name: String, mode: IO});
StructuralConcerns.setReference('pinMode', PinMode, -1);

var BehaviouralConcerns = Class.newInstance('BehaviouralConcerns');
App.setReference('behavioural', BehaviouralConcerns, 1);

var TimeConfig = Class.newInstance('TimeConfig', [], {initialTime: Number, debounce: Number});
BehaviouralConcerns.setReference('timeConfig', TimeConfig, 1);

var StateFunction = Class .newInstance(
        'StateFunction',
        [],
        {name: String, readOn: String, read: Signal, next: String}
    );
BehaviouralConcerns.setReference('stateFunction', StateFunction, -1);

var Write = Class.newInstance('Write', [], {on: String, value: Signal});
StateFunction.setReference('write', Write, -1);

var MainLoop = Class.newInstance('MainLoop', [], {init: String});
BehaviouralConcerns.setReference('mainLoop', MainLoop, 1);

var AbstractCode = new Model('AbstractCode', [], App, true);


/**
 * Code Generation
 */

function toCode(xs, n) {
    return _.map(xs, function(x) {return x.toCode()}).join(n);
}

App.prototype.toCode = function() {
    return toCode(this.structural) + '\n\n' + toCode(this.behavioural);
}

StructuralConcerns.prototype.toCode = function() {
    return toCode(this.alias, '\n')
      + '\n\n'
      + 'void setup() {\n'
      + toCode(this.pinMode, '\n')
      + '\n}';
}

BrickAlias.prototype.toCode = function() {
    return 'int ' + this.name + ' = ' + this.pin + ';';
}

PinMode.prototype.toCode = function() {
    return '  pinMode(' + this.name + ', ' + IO.getName(this.mode) + ');';
}

BehaviouralConcerns.prototype.toCode = function() {
    return toCode(this.timeConfig)
      + '\n\n'
      + toCode(this.stateFunction, '\n\n')
      + '\n\n'
      + toCode(this.mainLoop);
}

TimeConfig.prototype.toCode = function() {
    return 'long time = ' + this.initialTime + '; long debounce = ' + this.debounce + ';';
}

StateFunction.prototype.toCode = function() {
    return 'void state_' + this.name + '() {\n'
      + toCode(this.write, '\n\n')
      + '  boolean guard = millis() - time > debounce;\n'
      + '  if (digitalRead(' + this.readOn + ') == ' + Signal.getName(this.read) + ' && guard) {\n'
      + '    time = millis(); state_' +this.next + '();\n'
      + '  } else {\n'
      + '    state_' + this.name + '();\n'
      + '  }\n'
      + '}';
}

Write.prototype.toCode = function() {
    return '  digitalWrite(' + this.on + ', ' + Signal.getName(this.value) + ');\n';
}

MainLoop.prototype.toCode = function() {
    return 'void loop() { state_' + this.init + '(); }';
}

module.exports = JSMF.modelExport(AbstractCode);
