/**
 *   JavaScript Modelling Framework (JSMF)
 *   Copyright 2014 © Henri Tudor
 * 	 Copyright 2015 © LIST
 *   Authors : J.S. Sottet, A Vagner
 *
 *    Todo
 *      - Inheritance: ongoing
 *      - Checking :attributes and references overloading
 *      - implement different level of checking (type)
 *      - Checking for type in references according to supertypes inheritance chain
 *      - Checking for types that are not JS primitive types (attributes)
 *      - Persistance and Loading using JSON
 *		- Add keyword "Any" for loose typing
 *
 *   Done
 *      - Demotion (see JSMF_Utils)
 *
 */

var modelDB = require('./JSMFNeo4j.js'); // TODO Make a warapper for DB (
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
        this.modellingElements[Class.conformsTo().__name] = tab;
    } else {
        if (tab == undefined) {
            tab = [];
        }
        tab.push(Class);
        this.modellingElements[Class.__name] = tab;
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

Model.prototype.setModellingElements = function (ClassTab) {
    if (ClassTab instanceof Array) {
        for (i in ClassTab) {
            if (ClassTab[i].__name == undefined) { //i.e. not  a meta-element
                var tab = [];
                //console.log(Class.conformsTo());
                tab = this.modellingElements[ClassTab[i].conformsTo().__name];
                if (tab == undefined) {
                    tab = [];
                }
                tab.push(ClassTab[i]);
                this.modellingElements[ClassTab[i].conformsTo().__name] = tab;
            } else {
                this.modellingElements[ClassTab[i].__name] = ClassTab[i];
            }
        }
    } else {
        console.error("Unable to set one element use Model.setModellingElements calling setModellingElement with only one element.");
        this.setModellingElement(ClassTab);
    }
};

Model.prototype.setReferenceModel = function (metamodel) {
    this.referenceModel = metamodel;
}

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
	var Obj = new Class(classname); 
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

Class.prototype.getInheritanceChain = function () {
    var result = [];
    if (Object.getOwnPropertyNames(this.__superType).length == 0 || this.__superType == undefined) {
        return result;
    } else {
        result.push(this.__superType);
        this.__superType.getInheritanceChain();
    }
}

//WARNING
Class.prototype.conformsTo = function () {
    var result = new Class("M3Class");
    //result = this; //incorrect hypothesis <=> not self defined
    return Class.prototype;
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
            if (type === Class) { //bypasscheckType
                //console.log("Generic Type");
                ob[index].push(param);
            } else {
                if (type instanceof Array) { //warning checking all the element type in array
                    if (_.contains(type, param.conformsTo())) {
                        ob[index].push(param);
                    } else {
                        console.log("assigning wrong type: " + param.conformsTo().__name + " Expecting types in " + type);
                    }
                } else {
                    if (type == param.conformsTo() || _.contains(type, param.getInheritanceChain)) { //To be tested
                        ob[index].push(param);
                    } else {
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
    var allsuperType = self.getInheritanceChain();
    for (var sType in this.__superType) {
        var refSuperType = this.__superType[sType];
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
        result[i] = new this.__attributes[i]();
        var attype = this.__attributes[i];
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


module.exports = {

    Class: Class,

    Model: Model

};
