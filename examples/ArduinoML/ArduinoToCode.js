/**
 *   JavaScript Modelling Framework (JSMF)
 *
©2015 Luxembourg Institute of Science and Technology All Rights Reserved
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

Authors : Nicolas Biri
 */

'use strict'

// model imports
const JSTL = require('../../src/index')
const Transformation = JSTL.Transformation
const NAV = require('jsmf-magellan')
const Model = require('jsmf-core').Model

// other imports
const _ = require('lodash')
const inspect = require('eyes').inspector({maxLength: 50000})

// Metamodels
const MMI = require('./MMArduinoML')
const MMO = require('./MMAbstractCode')

// input file
const input = require('./MArduinoML').Switch
const output = new Model('Out')

const arduinoToCode = new Transformation()

arduinoToCode.addRule({
  name: 'Arduino App to Code App',
  in: x => NAV.allInstancesFromModel(MMI.App, x),
  out: function(i) {
    const app = MMO.App.newInstance()
    this.assign(app, 'structural', [i])
    this.assign(app, 'behavioural', [i])
    return [app]
  }
})

arduinoToCode.addRule({
  name: 'Structural concerns generation',
  in: x => NAV.allInstancesFromModel(MMI.App, x),
  out: function(i) {
    const s = MMO.StructuralConcerns.newInstance()
    this.assign(s, 'alias', i.brick)
    this.assign(s, 'pinMode', i.brick)
    return [s]
  }
})

arduinoToCode.addRule({
  name: 'Brick Alias generation',
  in: x => NAV.allInstancesFromModel(MMI.Brick, x),
  out: function(i) {
    return [MMO.BrickAlias.newInstance({name: i.name, pin: i.pin})]
  }
})

arduinoToCode.addRule({
  name: 'Pin mode definition for sensors',
  in: x => NAV.allInstancesFromModel(MMI.Sensor, x),
  out: function(i) {
    return [MMO.PinMode.newInstance({name: i.name, mode: MMO.IO.INPUT})]
  }
})

arduinoToCode.addRule({
  name: 'Pin mode definition for actuators',
  in: x => NAV.allInstancesFromModel(MMI.Actuator, x),
  out: function(i) {
    return [MMO.PinMode.newInstance({name: i.name, mode: MMO.IO.OUTPUT})]
  }
})

arduinoToCode.addRule({
  name: 'Behavioural concerns generation',
  in: x => NAV.allInstancesFromModel(MMI.App, x),
  out: function(i) {
    const b = MMO.BehaviouralConcerns.newInstance()
    b.timeConfig = MMO.TimeConfig.newInstance({initialTime: 0, debounce: 200})
    this.assign(b, 'stateFunction', i.state)
    this.assign(b, 'mainLoop', i.initial)
    return [b]
  }
})

arduinoToCode.addRule({
  name: 'Generate state function',
  in: x => NAV.allInstancesFromModel(MMI.State, x),
  out: function(i) {
    const t = i.transition[0]
    const s = MMO.StateFunction.newInstance({
      name: i.name,
      next: t.next[0].name,
      readOn: t.sensor[0].name,
      read: t.value
    })
    this.assign(s, 'write', i.action)
    return [s]
  }
})

arduinoToCode.addRule({
  name: 'Generate main loop',
  in: x => NAV.allInstancesFromModel(MMI.State, x),
  out: function(i) {
    return [MMO.MainLoop.newInstance({ init: i.name })]
  }
})


arduinoToCode.addRule({
  name: 'Ganarate Writes',
  in: x => NAV.allInstancesFromModel(MMI.Action, x),
  out: function(i) {
    return [MMO.Write.newInstance({
      on: i.actuator[0].name,
      value: i.value
    })]
  }
})


// launch transformation

const mapping = arduinoToCode.apply(input, output, true)

module.exports = {arduinoToCode, mapping}

_.forEach( NAV.allInstancesFromModel(MMO.App, output)
         , x => console.log(x.toCode()))
