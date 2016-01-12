/**
 *   JavaScript Modelling Framework (JSMF)
 *
©2015 Luxembourg Institute of Science and Technology All Rights Reserved
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

Authors : J.S. Sottet, A Vagner
Contributors: G. Garcia-Frey, N. Biri

* ideas to be implemented : could show transformation execution step by step, construct a model, etc.
*   todo :
            - Rule extension (inheritance)
            - Multiple input/output models
            - Hide the complex object for input
*/

var _ = require('lodash');

function TransformationModule(name, inputModel, outputModel) {
    this.name = name;
    this.inputModel = inputModel;
    this.outputModel = outputModel;
    this.rules = [];

    this.resolveRef = [];
    this.resolver = {};
}

TransformationModule.prototype.addRule = function(rule) {
        //check first condition + rules
       this.rules.push(rule);
}

TransformationModule.prototype.apply = function(rule) {
    var self = this;

    //WARNING the input model is fixed and should be specified by the rule or for each rules (i.e., multiple input models).
    var i = rule.in(this.inputModel);
    //
    //process output model elements
    _.each(i, function(id,index){
        var output = rule.out(id, self.inputModel);

        var partOutput = _.partition(output, function(idx) { return idx.conformsTo == undefined ;});
        self.resolveRef = self.resolveRef.concat(partOutput[0]);
        if (self.resolver[id.__jsmfId] === undefined) {
            self.resolver[id.__jsmfId] = [];
        }
        var resolverEntry = _.find(self.resolver[id.__jsmfId], function(x) {return x.key === id});
        if (resolverEntry === undefined) {
           resolverEntry = {key: id, value: []};
           self.resolver[id.__jsmfId].push(resolverEntry);
        }
        _.forEach(partOutput[1], function(idx) {
            self.outputModel.setModellingElement(idx); //set the reference to created model element to outputModel
        });
        resolverEntry.value = resolverEntry.value.concat(partOutput[1]);
    });
}

TransformationModule.prototype.applyAllRules = function() {
    var self = this;
    _.each(self.rules, function(elem,index) {
            self.apply(elem);
    });
    _.each(self.resolveRef,
       function(elem, index) {
        var relationName = elem.relationname;
        relationType = elem.source.conformsTo().getAllReferences()[relationName].type;
        var referenceFunctionName = 'set' + relationName[0].toUpperCase() + relationName.slice(1);
        _.each(elem.target,  // get the type of the target(s) of the relation element in the input model in order to...
            function(elem2) {
                var resolverEntry = _.find(self.resolver[elem2.__jsmfId], function(x) {return x.key === elem2}) || {key: elem2, value: []};
                _.each(resolverEntry.value, function(target) {
                    // check target type??
                    if (hasClass(target, relationType)) {
                        elem.source[referenceFunctionName](target);
                    }
                });
            }
        );
    });
}

var hasClass = function (x, type) {
    var types = type instanceof Array ? type : [type];
    return _.some(x.conformsTo().getInheritanceChain(),
                  function (c) {return _.includes(types, c)});
}

module.exports = {

    TransformationModule: TransformationModule

};
