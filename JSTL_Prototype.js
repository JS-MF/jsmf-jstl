var JSMF = require('./JSMF_Prototype'); var Model = JSMF.Model; var Class = JSMF.Class;
var _ = require('underscore');
var inspect = require('eyes').inspector({
    maxLength: 9000
});

function TransformationModule(name, inputModel, outputModel) {
    this.name = name;
    this.inputModel = inputModel;
    this.outputModel = outputModel;
    this.rules = [];
    
    this.resolveRef = [];
    this.resolver =  {};
}

TransformationModule.prototype.addRule = function(rule) {
        //check first condition + rules
       this.rules.push(rule);
}

TransformationModule.prototype.apply = function(rule) {
    var self = this;
    
    //get the input model element from the LHS specified in the rule.in
    var i = rule.in(this.inputModel);
    
    //process output model elements
    _.each(i, function(id,index){
        var output = rule.out(id); 
        //this.outputModel.setModellingElement ...
        console.log('id', id);
        self.resolver[JSON.stringify(id)]=output[0]; //WARNING STRINGIFY OBJECT AS KEY... should have other unique object id
         //inspect(self.resolver);
        if(output[1]!=undefined) {
            self.resolveRef.push(output[1]); //do a for each elem in output
        }
        self.outputModel.setModellingElement(output[0]);
        
        //console.log(mb.modellingElements);
    });
}

TransformationModule.applyAllRules = function() {
    var self = this;
    _.each(self.rules, function(elem,index) {
            self.apply(elem); 
    });
    
    _.each(module.resolveRef, 
       function(elem, index) {
        _.each(elem.target,  // get the type of the target(s) of the relation element in the input model in order to...
            function(elem2,index2) {  
                var target = module.resolver[JSON.stringify(elem2)]; // ... resolve the target of the relation in the output model!
        
                var referenceFunctionName = 'set'+elem.relationname;
                elem.source[referenceFunctionName](target);
            }
        );
    });
}

/*****************************************
    // context :  Model and MetamodeModel
******************************************/
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

B.setReference('toD', D, -1);

mma.setModellingElements([A,C]);
mmb.setModellingElements([B,D]); 

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


// Rule Delcaration => Warn must know the metamodel (i.e.: A__name, etc.
var t  = {
    in : function(inputModel) {
            return (_.select(inputModel.modellingElements[A.__name],  //hidereturn? hide ma.modellingElements
                    function(elem){
                        return elem.name!='titi';
                    }
            ));
    },
    out : function(inputID) {
            var b = B.newInstance('transformed'); //B (maj is identifer of metamodel element
            b.setbat(inputID.name+'_transfo'); 
            relation = {   
                source : b,
                relationname : 'toD',
                target : inputID.toC 
            }                           //equivalent to ATL <-> targetOutput <- i.targetInput
            return [b,relation];                 
    }
}

var trule2 = {
   in : function(inputModel) {
       return inputModel.modellingElements[C.__name];  //hidereturn? hide ma.modellingElements
    },
    out : function(inputID) { 
        var d = D.newInstance('transformed');
        d.setnum(inputID.id);
        return [d];                 
    }
}

//
var module = new TransformationModule('test', ma, mb);
module.addRule(t);
module.addRule(trule2);


module.apply(t);
module.apply(trule2);
//module.applyAllRules();
//inspect(module.resolveRef);
//inspect(module.resolver);

_.each(module.resolveRef, 
       function(elem, index) {
        _.each(elem.target,  // get the type of the target(s) of the relation element in the input model in order to...
            function(elem2,index2) {  
                var target = module.resolver[JSON.stringify(elem2)]; // ... resolve the target of the relation in the output model!
        
                var referenceFunctionName = 'set'+elem.relationname;
                elem.source[referenceFunctionName](target);
            }
        );
});

inspect(mb.modellingElements);
