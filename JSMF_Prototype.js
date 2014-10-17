/**
Inheritance to be done
Resolve reference in a model from a collection of (reference,type)
*/

var modelDB = require('./JSMFNeo4j.js');
var _ = require('underscore');

//DEF: Check Type Strict, Partial, None | Check Cardinality Strict, Partial, None, ...
//Natural => Formal
function Model(name) {
    this.__name = name;
	this.referenceModel={}; //set the metamodel of this
    this.modellingElements={};   
}

Model.prototype.setModellingElement = function(Class) {
	if(Class.__name == undefined) {
		var tab= [];
		//console.log(Class.conformsTo());
		tab = this.modellingElements[Class.conformsTo().__name];
		if(tab == undefined) {tab = [];}
		tab.push(Class);
		this.modellingElements[Class.conformsTo().__name] = tab;
	} else {
		this.modellingElements[Class.__name]=Class;
	}
};

Model.prototype.setModellingElements = function(ClassTab) {
if(ClassTab instanceof Array) {
	for(i in ClassTab) {
		if(ClassTab[i].__name == undefined) { //i.e. not  a meta-element
			var tab= [];
			//console.log(Class.conformsTo());
			tab = this.modellingElements[ClassTab[i].conformsTo().__name];
			if(tab == undefined) {tab = [];}
			tab.push(ClassTab[i]);
			this.modellingElements[ClassTab[i].conformsTo().__name] = tab;
		} else {
			this.modellingElements[ClassTab[i].__name]=ClassTab[i];
		}
	}
} else {
	console.error("Unable to set one element use Model.setModellingElements calling setModellingElement with only one element.");
	this.setModellingElement(ClassTab);
}
};

Model.prototype.setReferenceModel = function(metamodel) {
	this.referenceModel=metamodel;
}

Model.prototype.save = function() {
	// CHECK that ALL Referenced elements can be looked at in the DB : i.e., they have at least one attribute which is set...
	modelDB.saveModel(this);
}

//M2
function Class(name) {
    this.__name = name;
    this.__attributes = {};
    this.__references = {};
// name = string, type = string
}

Class.prototype.setAttribute = function (name, type) {
     if(_.contains(this.__attributes, name)) {
	} else {
		this.__attributes[name] = type;
	}
};

//WARNING
Class.prototype.conformsTo = function() {
    var result = new Class();
    result = this;
    //console.log(Class.prototype);
    return Class.prototype;
};

//Relation nature: Composition? Inheritance? etc...
Class.prototype.setReference = function (name, type, cardinality, opposite) {
    // verifier si le nom n'est pas d�j� pris, -> exception
    this.__references[name] = {
        "type": type,
         "card": cardinality
    };
	//To be TESTED
    if (opposite !== undefined) {
        var tmp = this.__references[name];
        tmp.opposite = opposite;
    }
};

function makeAssignation(ob,index, attype) {
	//if attype = primitive JS type else ...
	var type = new attype;
    return function(param) {
		if(param.__proto__ == type.__proto__) { //Strict equal?
			ob[index]=param;
        } else {
            console.log("Assigning wrong type: "+param.__proto__+" expected "+type.__proto__);
        }
    };
}

function makeReference(ob,index, type, card) {
    return function(param) { 
		//CheckCardinalities
		var elementsinrelation = ob[index].length;
		if(card==1 && elementsinrelation >= 1) {
				console.log("error trying to assign multiple elements to a single reference");
			} else {
			if(type === Class) { //bypasscheckType
				//console.log("Generic Type");
				ob[index].push(param);				
			} else {
			if( type instanceof Array) {
				if(_.contains(type,param.conformsTo())) {
					ob[index].push(param);
				} else {
					console.log("assigning wrong type: "+param.conformsTo().__name+" Expecting types in "+type);
				}
			} else {
				if(type==param.conformsTo()) {
					ob[index].push(param);
					} else {
						//ob[index].push(param); //WARNING DO the push if type 
						console.log("assigning wrong type: "+param.conformsTo().__name+" to current reference."+" Type "+type.__name+" was expected");					
					}
			}
			}
		}
    };
}

Class.prototype.newInstance = function (name) {
    var result = {}; // new Class(name); //=> see promotion //{}
    var self = this;
    //create setter for attributes
    for (var i in this.__attributes) {
        result[i] = new this.__attributes[i]();
		var attype = this.__attributes[i];
        result["set"+i] = makeAssignation(result,i, attype);	
    }
    //create setter for references
    for (var j in this.__references) {
        result[j] = [];
        var type = this.__references[j].type;
        var card = this.__references[j].card;
        result["set"+j] = makeReference(result,j, type, card);
    }

    // Assign the "type" to which M1 class is conform to.
    result.conformsTo = function() {
         return self; 
    };
	
    return result;
};
/*
// M1 -- TESTS
var M2FSM = new Model("FSM");
var State = new Class("State"); //other instanciations ? create...
var Transition = new Class("Transition");
var FSMmodel = new Model("FSMmodel");
FSMmodel.setReferenceModel(M2FSM);

M2FSM.setModellingElements(State);
M2FSM.setModellingElements(Transition);

State.setAttribute("name", String);
State.setAttribute("id", String);
//State.setAttribute("self", State); // throw an error => see function for attributes
State.setReference("transition", Transition, -1);
//State.setReference("SuperClass", Class.prototype, 1); /For Test purpose should work
Transition.setAttribute("name", String);
//Transition.setReference("source", State, 1);
Transition.setReference("dest", State, 1);

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
FSMmodel.setModellingElements(s);
FSMmodel.setModellingElements(s2);
FSMmodel.setModellingElements(transit);
FSMmodel.setModellingElements(transitbis);

//console.log(FSMmodel.modellingElements);
//modelDB.saveModel(M2FSM); //WARNING curreently not working
modelDB.saveModel(FSMmodel);

*/

/* Display all model elements in a model
for (i in FSMmodel.modellingElements) {
	//console.log(FSMmodel.modellingElements[i]);
	var modelElements = FSMmodel.modellingElements[i] //ModelElem = tab of modelling elements
	//console.log(i, modelElem);
	for( it in modelElements) {
		element = modelElements[it];
		for( j in element.conformsTo().__references) {
			console.log(j, element[j]);
		}
		for (att in element.conformsTo().__attributes) {
			console.log(att, element[att]);
		}
	}
} */



// Should be equivalent to modelDB.SaveModel
//modelDB.persist(s);
//modelDB.persist(s2);
//modelDB.persist(transit);

//modelDB.persistRelation(s);
//modelDB.persistRelation(s2);
//modelDB.persistRelation(transit);

 //resolve elements
//modelDB.resolve(s);
//modelDB.resolve(transit);
//modelDB.resolve(s2);

//modelDB.persist(transit); //WARNING Transient links
//

//modelDB.persistRelation(s);
//modelDB.deleteElement(s);


// TESTER
//s.settransition(s2); // will return an error wrong assignation 
//s.setSuperClass(Transition); // will return an error
//s.settransition(transit);

/*
var pushObject = {};
for(i in s.conformsTo().__attributes) {
	console.log(i+" : "+s[i]);
} 
for( i in transit.conformsTo().__references) {
	console.log(i);
	console.log(s[i]); // tab => for in in s[i] ...
	for(j in s[i]) {
		console.log(s[i][j]);
	}
}*/

//Create Meta-class
/*var Entity = new Class("entity");
Entity.setAttribute("attribute", {});

var e = Entity.newInstance("e");
e.setattribute({"name":String}); */

/*
// Test 2
var TestClass = new Class("TestClass");

var LowRangeClass = new Class("LowRangeClass");
var HighRangeClass = new Class("HighRangeClass");

var MegaClass = new Class("MegaClass");
MegaClass.setReference("test", Class,1);

TestClass.setAttribute("name", String);
TestClass.setAttribute("test", Number);
TestClass.setReference("from",[LowRangeClass, HighRangeClass],-1); //multityping

var low = LowRangeClass.newInstance("low");
var high = HighRangeClass.newInstance("high");

var z = TestClass.newInstance("z");

var mega = MegaClass.newInstance("mega");
mega.settest(z);
mega.settest(low);
z.setfrom(low);
z.setfrom(mega);
console.log(z.from);
*/

module.exports = {

Class : Class, 

Model : Model

};