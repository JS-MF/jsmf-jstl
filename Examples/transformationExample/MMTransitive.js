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

/*
 MMa = A->B->C
 MMb = D->E (where D->E = trans(A->C)
*/


var A = Class.newInstance('A');
A.setAttribute('name', String);
//A.setAttribute('value', e);

var B = Class.newInstance('B');
B.setAttribute('id', Number); //define other primitive types?

A.setReference('toB', B, -1);

var C = Class.newInstance('C');
C.setAttribute('name', String);

B.setReference('toC', C, -1);

var D = Class.newInstance('D');
D.setAttribute('name', String);

var E = Class.newInstance('E');
E.setAttribute('id',Number);

D.setReference('toE', E, -1);

mma.setModellingElements([A,B,C]);
mmb.setModellingElements([D,E]); 

var a = A.newInstance('');


module.exports = {
    
    mma : mma,
    
    mmb : mmb,

    A: A,
    
    B: B,
    
    C: C,
    
    D: D,

    E: E
};
