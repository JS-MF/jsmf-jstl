var JSMF = require('./JSMF_Prototype'); var Model = JSMF.Model; var Class = JSMF.Class;
var JSMFUtil = require('./JSMF_Util.js');
var _ = require('underscore');

/*****************************
* TEST UTIL JSMF : function 
******************************/

var FSM = new Model("FSM");
var State = new Class("State"); //other instanciations ? create...
var Transition = new Class("Transition");

State.setAttribute("name", String);
State.setAttribute("id", Number);
State.setReference("transition", Transition, -1);
//State.setReference("SuperClass", Class.prototype, 1);
Transition.setAttribute("name", String);
Transition.setReference("source", State, 1);
Transition.setReference("dest", State, 1);

FSM.setModellingElement(State);
FSM.setModellingElement(Transition);


var TobePushed = JSMFUtil.demote(FSM);
console.log(TobePushed);
TobePushed.save();


var FSMmodel = new Model("FSMmodel");
FSMmodel.setReferenceModel(FSM);
var s = State.newInstance("actorSearch");
var s2 = State.newInstance("actorDetails");
var transit = Transition.newInstance("transit");
var transitbis = Transition.newInstance("transitbis");
transit.setname("Page Transition with id");
transitbis.setname("Transition Bis");
s.setname("actorSearch");
s2.setname("actorDetails");
transit.setdest(s2);
s.settransition(transit);
s.settransition(transitbis);
s2.settransition(transitbis);
transitbis.setdest(s);

// Adding FSM model elements to the FSM Model conforms to FSM Metamodel
FSMmodel.setModellingElement(s);
FSMmodel.setModellingElement(s2);
FSMmodel.setModellingElement(transit);
FSMmodel.setModellingElement(transitbis);

//console.log(FSMmodel.modellingElements);
//modelDB.saveModel(M2FSM); //WARNING curreently not working
//FSMmodel.save();