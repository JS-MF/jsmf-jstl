/*
*  JSTL _ Javascript Transformation Language for JSMF
*   Copyright LIST - 
*   Author : JS Sottet
*   Contributors : A. Garcia-Frey, A Vagner
* ideas : could extend JSMF model and class in order to support specific operation (such as filter on Class)
*/


var JSMF = require('./JSMF_Prototype'); var Model = JSMF.Model; var Class = JSMF.Class;
//var _ = require('underscore');
var _ = require('lodash');
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
    
    //WARNING the input model is fixed and should be specified by the rule or for each rules (i.e., multiple input models).
    var i = rule.in(this.inputModel);
    
    //process output model elements
    _.each(i, function(id,index){
        var output = rule.out(id); 
        //this.outputModel.setModellingElement ...
            //console.log('id', id);
        //WARNING only one output model... one output element i.e., output[0] ... but other outputpatterns can be elicited!!!! 
        self.resolver[JSON.stringify(id)]=output[0]; //WARNING STRINGIFY OBJECT AS KEY... should have other unique object id
     
        if(output[1]!=undefined) {
            self.resolveRef.push(output[1]); //do a for each elem in output
        }
        self.outputModel.setModellingElement(output[0]);
        
        //console.log(mb.modellingElements);
    });
}

TransformationModule.prototype.applyAllRules = function() {
    var self = this;
    _.each(self.rules, function(elem,index) {
            self.apply(elem); 
    });
    //inspect(self.resolveRef);
    _.each(self.resolveRef, 
       function(elem, index) {
        _.each(elem.target,  // get the type of the target(s) of the relation element in the input model in order to...
            function(elem2,index2) {  
                var target = self.resolver[JSON.stringify(elem2)]; // ... resolve the target of the relation in the output model!
        
                var referenceFunctionName = 'set'+elem.relationname;
                elem.source[referenceFunctionName](target);
            }
        );
    });
}


module.exports = {

    TransformationModule: TransformationModule,

};
