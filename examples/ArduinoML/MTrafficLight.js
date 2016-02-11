'use strict';
var AML = require('./MMArduinoML.js')

var Class;
var Model;

(function() {
    var JSMF = require('jsmf');
    Model = JSMF.Model;
    Class = JSMF.Class;
}).call();

var trafficLight = new Model('Traffic Light');
trafficLight.setReferenceModel(AML.ArduinoML);

var actuators = {
    red: AML.Actuator.newInstance({name: 'red', pin: 13}),
    yellow: AML.Actuator.newInstance({name: 'yellow', pin: 12}),
    green: AML.Actuator.newInstance({name: 'green', pin: 11})
}
trafficLight.add([actuators.green, actuators.yellow, actuators.red]);

var button = AML.Sensor.newInstance({name: 'button', pin: 9});
trafficLight.add(button);

var greenAction = AML.Action.newInstance({value: AML.Signal.HIGH, actuator: green});
trafficLight.add(greenAction);
var greenTransition = AML.Transition.newInstance({value: AML.Signal.HIGH, sensor: button});
trafficLight.add(greenTransition);
var greenState = AML.State({name: 'greenState', action: greenAction, transition: greenTransition});
trafficLight.add(greenAction);

var yellowAction = AML.Action.newInstance({value: AML.Signal.HIGH, actuator: yellow});
trafficLight.add(yellowAction);
var yellowTransition = AML.Transition.newInstance({value: AML.Signal.HIGH, sensor: button});
trafficLight.add(yellowTransition);
var yellowState = AML.State({name: 'yellowState', action: yellowAction, transition: yellowTransition});
trafficLight.add(yellowAction);

var redAction = AML.Action.newInstance({value: AML.Signal.HIGH, actuator: red});
trafficLight.add(redAction);
var redTransition = AML.Transition.newInstance({value: AML.Signal.HIGH, sensor: button});
trafficLight.add(redTransition);
var redState = AML.State({name: 'redState', action: redAction, transition: redTransition});
trafficLight.add(redAction);

greenState.setNext(yellowState);
yellowState.setNext(redState);
redState.setNext(greenState);

var trafficLightApp = AML.App.newInstance({
    name: "TrafficLight",
    bricks: [button, actuators.green, actuators.yellow, actuators.red],
    state: [greenState, yellowState, redState],
    initial: greenState
});
trafficLight.add(trafficLightApp);

module.exports = {
    trafficLight: trafficLight,
    trafficLightApp: trafficLightApp
}
