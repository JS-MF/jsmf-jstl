/**
 *   JavaScript Modelling Framework (JSMF)
 *
©2015 Luxembourg Institute of Science and Technology All Rights Reserved
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

Authors : J.S. Sottet, A Vagner, N. Biri
Contributors: G. Garcia-Frey

* ideas to be implemented : could show transformation execution step by step, construct a model, etc.
*   todo :
            - Rule extension (inheritance)
            - Multiple input/output models
            - Hide the complex object for input
*/
'use strict';

var _ = require('lodash');


/** @constuctor
 * Initiate a transformation module.
 */
function Transformation() {
    this.rules = [];
    this.helpers = [];
}

/** Add a transformation rule to a transformation module.
 *  @param {Object} r - the rule.
 *  @param {function} r.in - A function that will take a inputModel in input to output a set of elements
 *        that must be implied in this transformation.
 *  @param {function} r.out - A function that take an element of the selection and (optionally) the input model in parameters
 *        and output an array of created elements.
 *  @param {string} r.name - An optional name for the rule, not used yet.
 */
Transformation.prototype.addRule = function(r) {this.rules.push(r)};

/** Add a helper to a transformation module.
 * @param {Object} h - the helper.
 *  @param {Function} h.generation - A function that will be applied on an input model
 *  @param {string} h.name - the name of the helper, that will be used to reference the helper when we need it.
 */
Transformation.prototype.addHelper = function(h) {this.helpers.push(h)};

function Context() {
    this.generated = new Mapping();
    this.helpers = {};
    this.referencesResolutions = [];
    this.generationLog = new Mapping();
}

Context.prototype.addResolution = function(r) {this.referencesResolutions.push(r)};

Context.prototype.assign = function(element, relationName, populators) {
    this.addResolution(new ReferenceResolution(element, relationName, populators));
}

/** @constructor
 * A transformation rule
 *  @param {function} selection - a function that will take a inputModel in input to output a set of elements
 *        that must be implied in this transformation.
 *  @param {function} out - A function that take an element of the selection and (optionally) the input model in parameters
 *  and output an array of created elements.
 *  @param {string} [name] - The name for the rule, not used yet.
 */
function Rule(selection, out, name) {
    /** @member {function} in */
    this.in = selection;
    /** @member {function} out */
    this.out = out;
    /** @member {string} name */
    this.name = name;
}

function runRule(rule, context, inputModel, outputModel, debug) {
    var selection = rule.in.call(context, inputModel);
    _.forEach(selection, function(e) {
        var generated = rule.out.call(context, e, inputModel);
        context.generated.map(e, generated);
        if (debug) {
          _.forEach(generated, function(x) {
              context.generationLog.map(x, {rule: rule, source: e});
          });
        }
        _.forEach(generated, function(x) {
            outputModel.addModellingElement(x);
        });
    });
}

/** @constructor
 *  @param {Function} generation - A function that will be applied on an input model
 *  @param {string} name - the name of the helper, that will be used to reference the helper when we need it.
 */
function Helper(generation, name) {
    this.map = generator;
    this.name = name;
}

function runHelper(helper, context, inputModel, outputModel) {
    var generated = helper.map.call(context, inputModel);
    context.helpers[helper.name] = generated;
}

/** @constructor
 * @param {Object} element - the element that will be modified by this resolution
 * @param {string} relationName - the name of the relation to populate
 * @param {Object[]} populators - the input model elements that should be resolved to populate the relation.
 */
function ReferenceResolution(element, relationName, populators) {
    this.source = element;
    this.relationName = relationName;
    this.target = populators;
}

function runResolution(resolution, generated) {
    var relationType = resolution.source.conformsTo().getAllReferences()[resolution.relationName].type;
    var referenceFunctionName = 'add' + resolution.relationName[0].toUpperCase() + resolution.relationName.slice(1);
    _.each(resolution.target,  // get the type of the target(s) of the relation element in the input model in order to...
           function(elem) {
               var values = generated.valuesFor(elem) || [];
               _.each(values, function(target) {
                    if (hasClass(target, relationType)) {
                        resolution.source[referenceFunctionName](target);
                    }
               });
           });
}

/** Apply a trsnformation on an input model, and put generated elements in a given ouput model.
 * @param {Object} inputModel - The input model.
 * @param {Object} outputModel - The output model.
 */
Transformation.prototype.apply = function(inputModel, outputModel, debug) {
    var ctx = new Context();
    _.forEach(this.helpers, function(h) {
        runHelper(h, ctx, inputModel, outputModel);
    });
    _.forEach(this.rules, function(r) {
        runRule(r, ctx, inputModel, outputModel, debug);
    });
    _.forEach(ctx.referencesResolutions, function(r) {
        runResolution(r, ctx.generated);
    });
    return ctx;
}

var hasClass = function (x, type) {
    var types = type instanceof Array ? type : [type];
    return _.some(x.conformsTo().getInheritanceChain(),
                  function (c) {return _.includes(types, c)});
}

function Mapping() {
    // aberration, we should use ES6 Map ASAP
}

Mapping.prototype.findEntry = function(k) {
    return _.find(this[k.__jsmfId], function(x) {return x.key === k;});
}

Mapping.prototype.valuesFor = function(k) {
    var entry = this.findEntry(k);
    if (entry !== undefined) {return entry.values;}
}

Mapping.prototype.map = function(k, v) {
    var entry = this.findEntry(k);
    if (entry === undefined) {
        entry = {key: k, values: []};
        if (this[k.__jsmfId] === undefined) {
            this[k.__jsmfId] = [entry];
        } else {
            this[k.__jsmfId].push(entry);
        }
    }
    v = v instanceof Array ? v : [v];
    entry.values = entry.values.concat(v);
}

module.exports = {

    Mapping: Mapping,
    Transformation: Transformation

};
