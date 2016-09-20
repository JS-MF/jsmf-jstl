'use strict'

const _ = require('lodash')
const JSMF = require('jsmf-core')

let Class, Model, Enum

(function() {
  Model = JSMF.Model
  Class = JSMF.Class
  Enum = JSMF.Enum
}).call()


const App = Class.newInstance('App')

const IO = new Enum('IO', ['INPUT', 'OUTPUT'])
const Signal = new Enum('Signal', ['LOW', 'HIGH'])

const StructuralConcerns = Class.newInstance('StructuralConcerns')
App.setReference('structural', StructuralConcerns, 1)

const BrickAlias = Class.newInstance('BrickAlias', [], {name: String, pin: JSMF.Range(0,13)})
StructuralConcerns.setReference('alias', BrickAlias, -1)

const PinMode = Class.newInstance('PinMode', [], {name: String, mode: IO})
StructuralConcerns.setReference('pinMode', PinMode, -1)

const BehaviouralConcerns = Class.newInstance('BehaviouralConcerns')
App.setReference('behavioural', BehaviouralConcerns, 1)

const TimeConfig = Class.newInstance('TimeConfig', [], {initialTime: Number, debounce: Number})
BehaviouralConcerns.setReference('timeConfig', TimeConfig, 1)

const StateFunction = Class .newInstance(
        'StateFunction',
        [],
        {name: String, readOn: String, read: Signal, next: String}
    )
BehaviouralConcerns.setReference('stateFunction', StateFunction, -1)

const Write = Class.newInstance('Write', [], {on: String, value: Signal})
StateFunction.setReference('write', Write, -1)

const MainLoop = Class.newInstance('MainLoop', [], {init: String})
BehaviouralConcerns.setReference('mainLoop', MainLoop, 1)

const AbstractCode = new Model('AbstractCode', [], App, true)


/**
 * Code Generation
 */

function toCode(xs, n) {
  return _.map(xs, x => x.toCode()).join(n)
}

App.prototype.toCode = () =>
  toCode(this.structural) + '\n\n' + toCode(this.behavioural)

StructuralConcerns.prototype.toCode =
  () => toCode(this.alias, '\n')
    + '\n\n'
    + 'void setup() {\n'
    + toCode(this.pinMode, '\n')
    + '\n}'

BrickAlias.prototype.toCode =
  () => 'int ' + this.name + ' = ' + this.pin + ';'

PinMode.prototype.toCode =
  () => '  pinMode(' + this.name + ', ' + IO.getName(this.mode) + ');'

BehaviouralConcerns.prototype.toCode =
 () => toCode(this.timeConfig)
   + '\n\n'
   + toCode(this.stateFunction, '\n\n')
   + '\n\n'
   + toCode(this.mainLoop)

TimeConfig.prototype.toCode =
  () => 'long time = ' + this.initialTime + '; long debounce = ' + this.debounce + ';'

StateFunction.prototype.toCode =
  () => 'void state_' + this.name + '() {\n'
    + toCode(this.write, '\n\n')
    + '  boolean guard = millis() - time > debounce;\n'
    + '  if (digitalRead(' + this.readOn + ') == ' + Signal.getName(this.read) + ' && guard) {\n'
    + '    time = millis(); state_' +this.next + '();\n'
    + '  } else {\n'
    + '    state_' + this.name + '();\n'
    + '  }\n'
    + '}'

Write.prototype.toCode =
  () => '  digitalWrite(' + this.on + ', ' + Signal.getName(this.value) + ');\n'

MainLoop.prototype.toCode =
 () => 'void loop() { state_' + this.init + '(); }'

module.exports = JSMF.modelExport(AbstractCode)
