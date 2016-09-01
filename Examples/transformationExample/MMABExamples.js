var JSMF = require('../../JSMF_Prototype'); var Model = JSMF.Model; var Class = JSMF.Class; var Enum = JSMF.Enum;
/*****************************************
    // context :  Model and MetamodeModel
******************************************/
var mma = new Model('MetaA');
var mmb = new Model('MetaB');


var e = new Enum('MyEnum');
e.setLiteral('input',0);
e.setLiteral('output',1);
e.setLiteral('in-output',2);

//console.log('e',e);


var A = Class.newInstance('A');
A.setAttribute('name', String);
//A.setAttribute('value', e);

var C = Class.newInstance('C');
C.setAttribute('id', Number); //define other primitive types?

A.setReference('toC', C, -1);

var B = Class.newInstance('B');
B.setAttribute('nameB', String);

var D = Class.newInstance('D');
D.setAttribute('num', Number);

B.setReference('toD', D, -1);

mma.setModellingElements([A,C]);
mmb.setModellingElements([B,D]); 

var a = A.newInstance('');


module.exports = {
    
    mma : mma,
    
    mmb : mmb,

    A: A,
    
    B: B,
    
    C: C,
    
    D: D

};
