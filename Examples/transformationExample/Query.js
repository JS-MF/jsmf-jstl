var JSTL = require('../JSTL_Prototype'); var TransformationModule= JSTL.TransformationModule;
var JSMF = require('../JSMF_Prototype'); var Model = JSMF.Model; var Class = JSMF.Class;


var _ = require('lodash');
//Load the metamodels (in one file for the example)
var MMI = require('./MMFamily.js'); 
var MMO = require('./MMPerson.js');

//Load the model (in one file for the example)
var Mi = require('./MFamily.js');

var inspect = require('eyes').inspector({
    maxLength: 9000
});

//Var query answer: returning all instances of family <=> all classes that conforms to X
var query1 = _.select(Mi.ma.Filter(MMI.Member), function(elem){
                   return( !(_.isEmpty(elem.familyFather)))
                }
            ); 
                       
                //select all daughters in a given familly.
//selection by : attributes names, class types and references

//selection of all classes related to this one, + lenght <=> all path to

//
var query2 = Mi.ma.Filter(MMI.Member);

console.log(query1);

