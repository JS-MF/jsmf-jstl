var JSTL = require('../JSTL_Prototype'); var TransformationModule= JSTL.TransformationModule;
var JSMF = require('../JSMF_Prototype'); var Model = JSMF.Model; var Class = JSMF.Class;

//Load the metamodels (in one file for the example)
var MMI = require('./MMFamily.js'); 
var MMO = require('./MMPerson.js');

//Load the model (in one file for the example)
var Mi = require('./MFamily.js');

//Create the outputModel
var Mo = new Model('Out');

var inspect = require('eyes').inspector({
    maxLength: 9000
});

// <=> to the underscore library.
var _ = require('lodash');

// ************************
//Helper
function isFemale(member) {     
    //Warning writting the function name... checking empty table
    return (member.familyMother.length!=0 || member.familyDaughter.length!=0);
}
//do a function for lastname

//Rule
var Member2Male = {                                     
    
    in : function(inputModel) {                      
        return  _.reject(inputModel.Filter(MMI.Member),
                    function(elem){
                      return isFemale(elem);       
                    });              
    },
    
    out : function(inp) { 
        var d = MMO.Male.newInstance('');    
        d.setfullName(inp.firstName+'');                        
        return [d];                 
    }
}

var Member2FeMale = {                                     
    
    in : function(inputModel) {                      
        return  _.select(inputModel.Filter(MMI.Member),
                    function(elem){
                        //console.log(elem);
                        return isFemale(elem);           
                      // return isFemale(elem);       
                    });              
    },
    
    out : function(inp) { 
        var d = MMO.Female.newInstance('');    
        d.setfullName(inp.firstName+'');                        
        return [d];                 
    }
}

// ***********************
var module = new TransformationModule('test', Mi.ma, Mo); //multiple 
module.addRule(Member2Male);
module.addRule(Member2FeMale);

//Apply rule by rule...
//module.apply(t);
//module.apply(trule2);

//inspect(Mi.ma.Filter(MMI.Member));

//Apply all rules in the models and resolve references, actual transformation execution
module.applyAllRules();

inspect(Mo);