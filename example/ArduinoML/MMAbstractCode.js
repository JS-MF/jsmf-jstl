'use strict';

var _ = require('lodash');

var Class;
var Model;
var Enum;

(function() {var JSMF = require('jsmf-core');
    Model = JSMF.Model;
    Class = JSMF.Class;
    Enum = JSMF.Enum;
}).call();

var AbstractCode = new Model('AbstractCode');

var App = Class.newInstance('App');

var IO = new Enum('IO', {INPUT: 0, OUTPUT: 1});
var Signal = new Enum('Signal', {LOW: 0, HIGH: 1});

var StructuralConcerns = Class.newInstance('StructuralConcerns');
App.setReference('structural', StructuralConcerns, 1);

var BrickAlias = Class.newInstance('BrickAlias', [], {name: String, pin: Number});
StructuralConcerns.setReference('alias', BrickAlias, -1);

var PinMode = Class.newInstance('PinMode', [], {name: String, mode: IO});
StructuralConcerns.setReference('pinMode', PinMode, -1);

var BehaviouralConcerns = Class.newInstance('BehaviouralConcerns');
App.setReference('behavioural', BehaviouralConcerns, 1);

var TimeConfig = Class.newInstance('Timeconfig', [], {initialTime: Number, debounce: Number});
BehaviouralConcerns.setReference('timeConfig', TimeConfig, 1);

var StateFunction = Class .newInstance(
        'StateFunction',
        [],
        {name: String, readOn: Number, read: Signal, next: String}
    );
BehaviouralConcerns.setReference('stateFunction', StateFunction, -1);

var Write = Class.newInstance('Write', [], {on: Number, value: Signal});
StateFunction.setReference('write', Write, -1);

var MainLoop = Class.newInstance('MainLoop', [], {init: String});
BehaviouralConcerns.setReference('mainLoop', MainLoop, 1);

AbstractCode.setModellingElements(
    [App, StructuralConcerns, BehaviouralConcerns, BrickAlias, PinMode, TimeConfig, StateFunction, MainLoop, Signal, IO]
);


/**
 * Code Generation
 */

App.toCode = function(app) {
    return StructuralConcerns.toCode(app.structural[0]) + '\n\n' + BehaviouralConcerns.toCode(app.behavioural[0]);
}

StructuralConcerns.toCode = function(x) {
    return _.map(x.alias, _.curry(BrickAlias.toCode)).join('\n')
      + '\n\n'
      + 'void setup() {\n'
      + _.map(x.pinMode, _.curry(PinMode.toCode)).join('\n')
      + '\n}';
}

BrickAlias.toCode = function(x) {
    return 'int ' + x.name + ' = ' + x.pin + ';';
}

PinMode.toCode = function(x) {
    return '  pinMode(' + x.name + ', ' + IO.resolve(x.mode) + ');';
}

BehaviouralConcerns.toCode = function(x) {
    return TimeConfig.toCode(x.timeConfig[0])
      + '\n\n'
      + _.map(x.stateFunction, _.curry(StateFunction.toCode)).join('\n\n')
      + '\n\n'
      + MainLoop.toCode(x.mainLoop[0]);
}

TimeConfig.toCode = function(x) {
    return 'long time = ' + x.initialTime + '; long debounce = ' + x.debounce + ';';
}

StateFunction.toCode = function(x) {
    return 'void state_' + x.name + '() {\n'
      + _.map(x.write, _.curry(Write.toCode)).join('\n\n')
      + '  boolean guard = millis() - time > debounce;\n'
      + '  if (digitalRead(' + x.readOn + ') == ' + Signal.resolve(x.read) + '&& guard) {\n'
      + '    time = millis(); state_' + x.next + '();\n'
      + '  } else {\n'
      + '    state_' + x.name + '();\n'
      + '  }\n'
      + '}';
}

Write.toCode = function(x) {
    return '  digitalWrite(' + x.on + ', ' + x.value + ');\n';
}

MainLoop.toCode = function(x) {
    return 'void loop() { state_' + x.init + '(); }';
}

module.exports = {
  App: App,
  StructuralConcerns: StructuralConcerns,
  BehaviouralConcerns: BehaviouralConcerns,
  BrickAlias: BrickAlias,
  PinMode: PinMode,
  TimeConfig: TimeConfig,
  StateFunction: StateFunction,
  Write: Write,
  MainLoop: MainLoop,
  Signal: Signal,
  IO: IO
}
