var JSTL = require('../../JSTL_Prototype'); var TransformationModule= JSTL.TransformationModule;
var JSMF = require('../../JSMF_Prototype'); var Model = JSMF.Model; var Class = JSMF.Class;

//Load the metamodels (in one file for the example)
var MM = require('./MMTransitive.js'); //var A = MM.A; //for defining quick access to metamodel elements

//Load the model (in one file for the example)
var M = require('./MTransitive.js');
var inspect = require('eyes').inspector({
    maxLength: 9000
});

// <=> to the underscore library.
var _ = require('lodash');

var id = 0;

/*****************************************************************
* example transformation input model (ma) and output model (mb)
* ma:   A(name) -> B(id)<->C(name)
*       ^        
*       |                  |
* mb:   D(name) --------> E(id(coming from B)
******************************************************************/
function getTransitiveElements(element) {
    var result = [];
    _.each(element.toB, function(elem,index) {
                    result.push(elem.toC);
    });
    return _.flatten(result,true);
}


var t0  = { //ATL <=> rule transformation1 {
    
    in : function(inputModel) { //ATL <=> from inputModel : 
            return (inputModel.Filter(MM.A))
    },
    
    out : function(inp) {                           //ATL <=> to (withtout any ref to output elements)
            var d = MM.D.newInstance('');           // <=> o : MM!B //here we call newInstance explicitly.. should be hidden
            d.setname(inp.name+'_transformed');        //ATL <=> nameB <= inp.name+'transfo'
            
            relation = {   
                source : d,
                relationname : 'toE',
                target : getTransitiveElements(inp)        
            }                           
            
            return [d, relation]; //to be hidden?.... order independent, possible mutilple outputmodel elements!        
    }
}

//Rule with relations
var transformation1  = { //ATL <=> rule transformation1 {
    
    in : function(inputModel) { //ATL <=> from inputModel : 
            return (inputModel.Filter(MM.C)
                 )    
    },
    
    out : function(inp) {                           //ATL <=> to (withtout any ref to output elements)
            var e = MM.E.newInstance('');           
            e.setid(id++); //!! Should be computed
            
            return [e];        //to be hidden?.... order independent, possible mutilple outputmodel elements!        
    }
}

/* *************************
*   Transformation Launcher 
*****************************/
var module = new TransformationModule('test', M.ma, M.mb); //multiple input/output models? -> not implemented yet
//Order independent
module.addRule(transformation1);
module.addRule(t0);
//Apply rule by rule...
//module.apply(t);
//module.apply(trule2);

//Apply all rules in the models and resolve references, actual transformation execution
module.applyAllRules();

inspect(M.mb);

//M.mb.save();
//(_(M.mb.Filter(MM.B)).first()); 

//Persiste Model in DB (using the Neo4J connector
//M.mb.save();