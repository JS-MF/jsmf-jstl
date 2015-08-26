/*
*  JSTL _ Javascript Transformation Language for JSMF
*   Copyright LIST - 
*   Author : JS Sottet
*   Contributors : A. Garcia-Frey, A Vagner
* ideas to be implemented : could extend JSMF model and class in order to support specific operation (such as filter on Class)
*                           could show transformation execution step by step, construct a model, etc.
*   todo : 
            - Rule extension (inheritance)
            - Multiple input/output models
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
        /* //old version: only 1 relation and 1 outputmodel element
        self.resolver[JSON.stringify(id)]=output[0]; 
        
        if(output[1]!=undefined) {
            self.resolveRef.push(output[1]); //do a for each elem in output
        }
        */
        
        _.each(output, function(idx,index) { 
            if(idx.conformsTo==undefined) { //is resolve reference table (i.e. has no metamodel)
                self.resolveRef.push(output[index]);
            } else { //is outputelement (i.e. has a metamodel)
                self.resolver[JSON.stringify(id)]=output[index]; //WARNING STRINGIFY OBJECT AS KEY... should have other unique object id
                self.outputModel.setModellingElement(output[index]); //set the reference to created model element to outputModel
            }
        });
            
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