var JSMF = require('jsmf'); var Model = JSMF.Model; var Class = JSMF.Class;
var _ = require('lodash');
var inspect = require('eyes').inspector({
    maxLength: 9000
});


var mma = new Model('MetaA');
var mmb = new Model('MetaB');

var A = Class.newInstance('A');
A.setAttribute('name', String);

var C = Class.newInstance('C');
C.setAttribute('id', Number); //define other primitive types?

A.setReference('toC', C, -1);

var B = Class.newInstance('B');
B.setAttribute('bat', String);

var D = Class.newInstance('D');
D.setAttribute('num', Number);

B.setReference('toD', D, 1);

mma.setModellingElements([A,C]);
mmb.setModellingElements([B,D]); //should check if calling single assignation (setModellingElement to a collection).


//** ********************************
// setting transformation example
//** ********************************
var ma = new Model('a');
var instancea = A.newInstance('a');
instancea.setname('toto');
var instanceaa = A.newInstance('aa');
instanceaa.setname('titi');

var instancec = C.newInstance('c');
instancec.setid(3);

var instancecc = C.newInstance('cc');
instancecc.setid(15);

instancea.settoC(instancec);
instancea.settoC(instancecc);

ma.setReferenceModel(mma); //should check conformance?
ma.setModellingElements([instancea,instanceaa,instancec,instancecc]); //add a dummy creator of modelling elements
//should be created by default in ma model...

var mb = new Model('b');
mb.setReferenceModel(mmb);

var j = ma.modellingElements[A.__name]; //equivalent of metamodel!element.all instances from

//*********************************
// transformation set
// *******************************

//map (source,target(s))
var resolveRef = [];
var resolver =  {};

function Rule1 () {
//Rule filter
    var i = _(ma.modellingElements[A.__name]).select(
                 function(elem){
                     return elem.name!='titi';
                 }
            );
//Rule application (on filtered element)
    _.each(i,
        function(elem,index){ //hide the _.each within a function
            var b = B.newInstance('transformed');
            b.setbat(elem.name+'_transfo');

            relation = {
                source : b,
                relationname : 'toD',
                target : elem.toC
            }                           //equivalent to ATL <-> targetOutput <- i.targetInput

            resolveRef.push(relation);  //should be hidden!
            resolver[elem]=b;           // idem

            mb.setModellingElement(b);  //should be hidden?
        ;}
    );
}

function Rule2 () {
//from
    var i = ma.modellingElements[C.__name];
//to
    _.each(i,
        function(elem,index){ //hide the _.each within a function
            var d = D.newInstance('transformed');
            d.setnum(elem.id);

            resolver[elem]=d; // should be hidden

            mb.setModellingElement(d);
        ;}
    );
}

Rule1(); //req call back? , order independent/not deterministic execution (like ATL);
Rule2();

//Should be tested  on multi valued references
_.each(resolveRef,
       function(elem, index) {
        _.each(elem.target,  // get the type of the target(s) of the relation element in the input model in order to...
            function(elem2,index2) {
                var target = resolver[elem2]; // ... resolve the target of the relation in the output model!
                var referenceFunctionName = 'set'+elem.relationname;
                elem.source[referenceFunctionName](target);
            }
        );
});

console.log(mb.modellingElements);
console.log(ma.modellingElements);
console.log(resolver);
//ma.save();
//mb.save();
/************************
** ATL comparison

Rule X  { // function Rule1() {

from  //maybe replace var i = ma.modellinglement ...
   i: mma!A  //_.each(ma.modellingElements[A.__name])  (i.name!=titi) //_.select(ma.modellingElements[A.__name], function(elem) {elem.name!='titi')

to
    o: mmb!B (  //var o = B.newInstance('');
        bat <- i.name+'_transfo' //o.setbat(elem.name+'_transfo')
        toD <- i.toC
    )
}
*/
