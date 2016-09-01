var JSMF = require('../../JSMF_Prototype'); var Model = JSMF.Model; var Class = JSMF.Class;
//var Domain = require('./Domain');


var mmState = new Model('StateModel');

var State = Class.newInstance('State');
State.setAttribute('name', String);

var BehaviorState = Class.newInstance('Behavior');
BehaviorState.setSuperType(State);

var InitState = Class.newInstance('InitState');
InitState.setSuperType(State);

var SelectionState = Class.newInstance('SelectionState');
SelectionState.setSuperType(State);

var InputState = Class.newInstance('InputState');
InputState.setSuperType(State);

var Transition = Class.newInstance('Transition');
Transition.setAttribute('name',String);

var Type = Class.newInstance('Type');

Transition.setReference('types',Type,-1);
Transition.setReference('source', State, 1, 'transitions');
Transition.setReference('target', State, 1);

State.setReference('transitions', Transition,-1,'source');



mmState.setModellingElements([State, SelectionState, InitState, InputState, BehaviorState, Transition, Type]);

module.exports = {
    
    mmState : mmState,

    State: State,
    
    Transition: Transition,
    
    
};
