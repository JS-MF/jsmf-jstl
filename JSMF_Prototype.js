/**
*   JavaScript Modelling Framework (JSMF)
*   Copyright 2014 © Henri Tudor
*   Authors : J.S. Sottet, A Vagner
*
*   - Inheritance to be done
*   - Affect a model from a collection of (reference,type)
*   - Checking :attributes and references overloading
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

//WARNING CHECK if classs is defined
Model.prototype.setModellingElement = function(Class) {
    var tab= [];
	if(Class.__name == undefined) {	
		tab = this.modellingElements[Class.conformsTo().__name];
		if(tab == undefined) {tab = [];}
		tab.push(Class);
		this.modellingElements[Class.conformsTo().__name] = tab;
	} else {
        if(tab == undefined) {tab = [];}
		tab.push(Class);
		this.modellingElements[Class.__name]=tab;
	}
};

Model.prototype.contains = function(ModelElement) {	
	var indexM = ModelElement.conformsTo().__name;
	var result = _.contains(this.modellingElements[indexM],ModelElement);
	return result;
}

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
	// CHECK that ALL Referenced elements are valid in the DB : i.e., they have at least one attribute which is set...
	modelDB.saveModel(this);
}

//M2
function Class(name) {
    this.__name = name;
    this.__attributes = {};
    this.__references = {};
	this.__superType = {};
// name = string, type = string
}

Class.prototype.setAttribute = function (name, type) {
     if(_.contains(this.__attributes, name)) {
	} else {
		this.__attributes[name] = type;
	}
};

Class.prototype.getInheritanceChain = function() {
	var result = [];
	if(this.__superType==undefined) {
		return result;
	} else {
		result.push(this.__superType);
		this.__superType.getInheritanceChain();
	}
}

//WARNING
Class.prototype.conformsTo = function() {
    var result = new Class("M3Class");
    //result = this; //incorrect hypothesis <=> not self defined
    return  Class.prototype;
};

//Relation nature: Composition? Inheritance? etc...
Class.prototype.setReference = function (name, type, cardinality, opposite) {
    // verifier si le nom n'est pas  pris, -> exception
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


module.exports = {

Class : Class, 

Model : Model

};