//M2
function Class(name) {
    this.__name = name;
    this.__attributes = {};
    this.__references = {};
// name = string, type = string
}

Class.prototype.setAttribute = function (name, type) {
    // verifier si le nom n'est pas déjà pris, -> exception
    this.__attributes[name] = type;
};


Class.prototype.setReference = function (name, type, cardinality, opposite) {
    // verifier si le nom n'est pas déjà pris, -> exception
    this.__references[name] = {
        "type": type,
         "card": cardinality
    };
    if (opposite !== undefined) {
        var tmp = this.__references[name];
        tmp.opposite = opposite;
    }
};

function makeAssignation(ob,index) {
    return function(param) {
        ob[index]=param;
        //console.log(index, param)
    }
};

function makeReference(ob,index) {
    return function(param) { 
        //CheckCardinality
        //checkType
        ob[index].push(param);
        console.log(index,param);
    }
};

Class.prototype.newInstance = function (name) {
    var result =  {};//new Class(name);
	console.log(result);
    var self = this;
    //create setter for attributes
    for (var i in this.__attributes) {
        result[i] = new this.__attributes[i]();
        console.log(i);
        result["set"+i] = makeAssignation(result,i);	
    }
    //create setter for references
    for (var j in this.__references) {
        result[j] = [];//check type new this.__references[j].type();
        console.log(this.__references[j].type);
        result["set"+j] = makeReference(result,j);
    }
    
    result.conformsTo = function() {
        return self;
    };
    return result;
};

// M1
var State = new Class("State"); // instanciation ??

var Transition = new Class("Transition");

State.setAttribute("name", String);
State.setAttribute("id", String);
State.setReference("transition", Transition, -1);
State.setReference("SuperClass", Class,1);
Transition.setReference("source", State, 1);
Transition.setReference("dest", State, 1);

var s = State.newInstance("actorDetails");
var transit = Transition.newInstance("transit");
console.log(actorDetails);
s.setname("t");
s.setSuperClass(State);
s.settransition(transit);