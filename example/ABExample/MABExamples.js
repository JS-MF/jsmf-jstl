var JSMF = require('jsmf'); var Model = JSMF.Model; var Class = JSMF.Class;
var MM = require('./MMABExamples.js'); var A = MM.A; var B = MM.B; var C = MM.C; var D = MM.D;
var inspect = require('eyes').inspector({
    maxLength: 9000
});
//** ********************************
// setting transformation example
//** ********************************
var ma = new Model('a');
var instancea = MM.A.newInstance('a');
instancea.setName('toto');
var instanceaa = A.newInstance('aa');
instanceaa.setName('titi');

var instancec = C.newInstance('c');
instancec.setId(3);

var instancecc = C.newInstance('cc');
instancecc.setId(15);

instancea.setToC(instancec);
instancea.setToC(instancecc);

ma.setReferenceModel(MM.mma); //should check conformance?
ma.setModellingElements([instancea,instanceaa,instancec,instancecc]); //add a dummy creator of modelling elements
//should be created by default in ma model...
inspect(ma);

//Create an empty model mb
var mb = new Model('b');
mb.setReferenceModel(MM.mmb);
//console.log(MM.mmb.modellingElements);

module.exports = {

    ma : ma,

    mb : mb
};
