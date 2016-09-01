var JSMF = require('../../JSMF_Prototype'); var Model = JSMF.Model; var Class = JSMF.Class;
var MM = require('./MMTransitive.js'); var A = MM.A; var B = MM.B; var C = MM.C; var D = MM.D;
var E = MM.E;

var inspect = require('eyes').inspector({
    maxLength: 9000
});

var _ = require('lodash');


var ma = new Model('a');
var mb = new Model('b');
var a = A.newInstance('a1');
var b = B.newInstance('b1');
var b2 = B.newInstance('b2');
var c = C.newInstance('c1');
var c2 = C.newInstance('c2');

a.setname('init');
b.setid(10);
c.setname('last');
b2.setid(12);
a.settoB(b);
a.settoB(b2);
b.settoC(c);
b2.settoC(c2);

var d = D.newInstance('d0');
var e = E.newInstance('e0');

d.settoE(e);

ma.setReferenceModel(MM.mma); //should check conformance?
ma.setModellingElements([a,b,c,b2,c2]); //Warning model element should be added by construction!

mb.setReferenceModel(MM.mmb);

/*
var x = [];
_.each(a.toB, function(elem,index) {
                    x.push(elem.toC);
});
var rest = _.flatten(x, true);
inspect(rest); //x is a table of table!!! => that will not work
*/

//can also use the transitive closure algo (or something like).
module.exports = {
    
    ma : ma,
    
    mb : mb
};