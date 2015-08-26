/**
 *   JavaScript Modelling Framework (JSMF)
 *   Copyright 2014 © Henri Tudor
 * 	 Copyright 2015 © LIST
 *   Authors : J.S. Sottet, A Vagner
 *
 *    Todo
 *      | Inheritance, Attributes and references overloading: Tested - Still missing For Reference inheritance
 *      - Get all the attribute of a given "Model"
 *      - implement different level of checking (type) : different conformances-flexibility
 *      - Checking for type in references according to supertypes inheritance chain
 *      - Setting and Checking for types that are not JS primitive types (attributes)
 *      - Persistence and Loading using JSON
 *      - Enhance Persistence/check persistence with Neo4J -> using batch / update 
 *      - load model from db neo4J?
 *		- Add keyword "Any" for loose typing?
 *      - Dynamic of objects/instances/classes e.g., adding an attribute to the clas after instanciation will allow the object to set/get the new attribute.
 *      - Permit the addition of new attribute/relation without behing an instance of a specific class
 *      - Add the inference/generalisation of instance attribute to class
 *      - Add a checking between Models and Metamodel (conformance).
 *      | Build a fonction that get all Attribute and/or all reference from the inheritance chain. To be tested
 *
 *   Done
 *      | Demotion/Promotion (see JSMF_Utils) --> to be enhanced thanks to model<->reference model associations
 *
 */

var modelDB = require('./JSMFNeo4j.js'); // not direclty requiering Neo4J-JSMF
var _ = require('underscore');

//DEF: Check Type Strict, Partial, None | Check Cardinality Strict, Partial, None, ...
//Natural => Formal
function Model(name) {
    this.__name = name;
    this.referenceModel = {}; //set the metamodel of this
    this.modellingElements = {};
}

//WARNING CHECK if classs is defined
Model.prototype.setModellingElement = function (Class) {
    var tab = [];
    if (Class.__name == undefined) {
        tab = this.modellingElements[Class.conformsTo().__name];
        if (tab == undefined) {
            tab = [];
        }
        
        tab.push(Class);
        console.log('ConformsTo : ', Class.conformsTo().__name); 
        this.modellingElements[Class.conformsTo().__name] = tab;
    } else {
        if (tab == undefined) {
            tab = [];
        }
        tab.push(Class);
        this.modellingElements[Class.__name] = tab;
       
    }
};

//
Model.prototype.setModellingElements = function (ClassTab) {
    if (ClassTab instanceof Array) {
        for (i in ClassTab) {
            if (ClassTab[i].__name == undefined) { //i.e. not  a meta-element
                var tab = [];
     
                tab = this.modellingElements[ClassTab[i].conformsTo().__name];
                if (tab == undefined) {
                    tab = [];
                }
                tab.push(ClassTab[i]);
                this.modellingElements[ClassTab[i].conformsTo().__name] = tab;
               // console.log('Conformsto: ', ClassTab[i].conformsTo().__name);
            } else {
                this.modellingElements[ClassTab[i].__name] = ClassTab[i];
            }
        }
    } else {
        console.error("Unable to set one element use Model.setModellingElements calling setModellingElement with only one element.");
        this.setModellingElement(ClassTab);
    }
};

//Send to JSMF Util?
Model.prototype.getPersistedID = function (ModelElement) {
    var result = modelDB.resolve(ModelElement);
    return result;
}

//Send to JSMF Util?
Model.prototype.contains = function (ModelElement) {
    var indexM = ModelElement.conformsTo().__name;
    var result = _.contains(this.modellingElements[indexM], ModelElement);
    return result;
}


Model.prototype.Filter = function(Classifier) {
 return this.modellingElements[Classifier.__name] ;  
    
}

Model.prototype.setReferenceModel = function (metamodel) {
    this.referenceModel = metamodel;
}

//WARNING model could be correct in JSMF sense but not in Neo4J.
Model.prototype.save = function () {
    // CHECK that ALL Referenced elements are valid in the DB : i.e., they have at least one attribute which is set...
    modelDB.saveModel(this);
}

//M2
function Class(name) {
    this.__name = name;
    this.__attributes = {};
    this.__references = {};
    this.__superType = {};
}

Class.newInstance = function (classname){ 
	var Obj = new Class(classname);  //here check promote/demote functions
	return Obj; 
};

//Class conformsTo itself (metacircularity)
Class.conformsTo = function() {
	return Class; 

};

Class.prototype.setAttribute = function (name, type) {
    if (_.contains(this.__attributes, name)) {} else {
        this.__attributes[name] = type;
    }
};

Class.prototype.setSuperType = function (Class) {
    this.__superType[Class.__name] = Class;
}

Class.prototype.getInheritanceChain = function(result) {
    if (Object.getOwnPropertyNames(this.__superType).length == 0 || this.__superType == undefined) {
        return result;
    } else {
        for(i in this.__superType) {
			result.push(this.__superType[i]);	
		}		
        return this.__superType[i].getInheritanceChain(result);
    }
}

//
Class.prototype.getAllReferences = function() {
    var result={};
    _.each(this.__references, function(elem, index) {
        result[index]=elem;
    });
    var allsuperTypes = this.getInheritanceChain([]);
    for(var i in allsuperTypes) {
		refSuperType = allsuperTypes[i];
        _.each(refSuperType.__references, function(elem, index) {
            result[index]=elem;
        });
	}
    return result;  
}

Class.prototype.getAllAttributes = function() {
    var result=[];
    result.push(this.__attributes)
    var allsuperTypes = this.getInheritanceChain([]);
    for(var i in allsuperTypes) {
		refSuperType = allsuperTypes[i];
        result.push(refSuperType.__attributes);
	}
    return result;  
}

//Instance of MetaClass is conforms to Class.
Class.prototype.conformsTo = function () {
    //var result = new Class("M3Class");
    //result = this; //incorrect hypothesis <=> not self defined
    return Class; //.prototype;
};

//Relation nature: Composition: added +unprecised number of arguments key/value toset some addition info on the reference.
Class.prototype.setReference = function (name, type, cardinality, opposite, composite) {
    //check name?
    this.__references[name] = {
        "type": type, //should check the type?
        "card": cardinality
    }
    //To be TESTED
    if (opposite !== undefined) {
        var tmp = this.__references[name];
        tmp.opposite = opposite;
    }
    if (composite !== undefined) {
         var tmp = this.__references[name];
        tmp.composite = composite;
    }
};

/******************************
//Enum definition : should extend class? or a super class classifier?
*****************************/
function Enum(name) {
    this.__name = name;
    this.__literals = {};
    return this;
}

Enum.prototype.conformsTo = function() {return Enum;}

Enum.prototype.setLiteral = function(name, value) {
     if (_.contains(this.__literals, name)) {} else {
        this.__literals[name]=value;
     }
};

Enum.prototype.getValue= function(name) {
    return this.__literals[name];
}

/****************************************************************************************
*       Building Instance: attributes and references conforms to metamodel elements
****************************************************************************************/
function makeAssignation(ob, index, attype) {
    //if attype = primitive JS type else ...
    var type = new attype;
    return function (param) {
        if (param.__proto__ == type.__proto__) { //Strict equal?
            ob[index] = param;
        } else {
            console.log("Assigning wrong type: " + param.__proto__ + " expected " + type.__proto__);
        }
    };
}

function makeReference(ob, index, type, card) {
    return function (param) {
        //CheckCardinalities
        var elementsinrelation = ob[index].length;
        if (card == 1 && elementsinrelation >= 1) {
            console.log("error trying to assign multiple elements to a single reference");
        } else {
            if (type === Class) { // <=> bypasscheckType
                ob[index].push(param);
            } else {
                if (type instanceof Array) { //warning checking all the element type in array
                    if (_.contains(type, param.conformsTo())) {
                        ob[index].push(param);
                    } else {
                        console.log("assigning wrong type: " + param.conformsTo().__name + " Expecting types in " + type);
                    }
                } else {                    
                    if (type == param.conformsTo() || _.contains(type,param.conformsTo().getInheritanceChain([]))) { //|| _.contains(type, param.getInheritanceChain([])) //WARNING : Debugging Inheritance issue by Ava
                        ob[index].push(param);
                    } else {
                        console.log(_.contains(param.conformsTo().getInheritanceChain([])),type);
                        console.log(param.conformsTo().getInheritanceChain([]))
                        //ob[index].push(param); //WARNING DO the push if type 
                        console.log("assigning wrong type: " + param.conformsTo().__name + " to current reference." + " Type " + type.__name + " was expected");
                    }
                }
            }
        }
    };
}

Class.prototype.newInstance = function (name) {
    var result = {}; 
    var self = this;
	
    //create setter for attributes from superclass
    var allsuperType = this.getInheritanceChain([]);

	for(var i in allsuperType) {
		refSuperType = allsuperType[i];
        for (var sup in refSuperType.__attributes) {
         	result[sup] = new refSuperType.__attributes[sup]();
            var attype = refSuperType.__attributes[sup];
            result["set" + sup] = makeAssignation(result, sup, attype);
       	}
        //do the same for references
        for (var sup in refSuperType.__references) {
            result[sup] = [];
            var type = refSuperType.__references[sup].type;
            var card = refSuperType.__references[sup].card;
            result["set" + sup] = makeReference(result, sup, type, card);
        }
	}

    //create setter for attributes (super attributes will be overwritten if they have the same name)
    for (var i in this.__attributes) {
        if(this.__attributes[i].conformsTo== undefined) {
            result[i] = new this.__attributes[i](); //Warning work for JS primitive types... and any function ... but not for enum type overload primitves?
            var attype = this.__attributes[i];
        } else {
            console.log(this.__attributes[i]);
        }
        result["set" + i] = makeAssignation(result, i, attype);
    }

    //create setter for references (super references will be overwritten if they have the same name)
    for (var j in this.__references) {
        result[j] = [];
        var type = this.__references[j].type;
        var card = this.__references[j].card;
        result["set" + j] = makeReference(result, j, type, card);
    }

    // Assign the "type" to which M1 class is conform to.
    result.conformsTo = function () {
        return self;
    };

    return result;
};

//Export three main framework functions
module.exports = {

    Class: Class,

    Model: Model,
    
    Enum : Enum

};