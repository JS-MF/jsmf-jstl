var JSTL = require('../JSTL_Prototype'); var TransformationModule= JSTL.TransformationModule;
var JSMF = require('../JSMF_Prototype'); var Model = JSMF.Model; var Class = JSMF.Class;

//Load the metamodels (in one file for the example)
var MM = require('./MMABExamples.js'); 

//Load MMArchi
//Load MMSecurity

//Load the model (in one file for the example)
var M = require('./MABExamples.js');

var inspect = require('eyes').inspector({
    maxLength: 9000
});

// <=> to the underscore library.
var _ = require('lodash');


function relationThreatList() {
 return [];   
}

function relationAList() {
 return [];   
}

//Simple Rule Definition
var rule = {                                      //ATL <=> 
    
    in : function(inputModel) {                      //ATL <=> from inputModel : MM!C
        return inputModel.;              
    },
    
    out : function(inp) { 
        var d = MM.D.newInstance('transformed');    //ATL<~>d: MM!D (
        d.setnum(inp.id);                           // ATL <=> num <- inp.id
        return [d];                 
    }
}