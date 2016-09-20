/** @license
 *
 *   JavaScript Modelling Framework (JSMF)
 *
©2015-2016 Luxembourg Institute of Science and Technology All Rights Reserved
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

Authors : J.S. Sottet, A Vagner, N. Biri
Contributors: G. Garcia-Frey

*/
'use strict'

const _ = require('lodash')
const JSMF = require('jsmf-core')
const Mapping = require('./Mapping')


/** @constuctor
 * Initiate a transformation module.
 */
function Transformation(rules, helpers) {
  this.rules = []
  this.helpers = []
  _.forEach(rules, x => this.addRule(x))
  _.forEach(helpers, x => this.addHelper(x))
}

/** Add a transformation rule to a transformation module.
 *  @param {Object} r - the rule.
 *  @param {function} r.in - A function that will take a inputModel in input to output a set of elements
 *        that must be implied in this transformation.
 *  @param {function} r.out - A function that take an element of the selection and (optionally) the input model in parameters
 *        and output an array of created elements.
 *  @param {string} r.name - An optional name for the rule, not used yet.
 */
Transformation.prototype.addRule = function(r) {
  if (_.every(['in', 'out'], x => _.has(r, x))) {
    this.rules.push(r)
  } else {
    throw new Error(`Invalid rule: ${r}`)
  }
}

/** Add a set of transformation rules to a transformation module.
 *  @param {Object} rules - the set of rules, each key correspond to a rule.
 */
Transformation.prototype.addRules = function(rules) {
  _.forEach(rules, (rule, name) => {
    rule.name = name
    this.addRule(rule)
  })
}

/** Add a helper to a transformation module.
 * @param {Object} h - the helper.
 *  @param {Function} h.generation - A function that will be applied on an input model
 *  @param {string} h.name - the name of the helper, that will be used to reference the helper when we need it.
 */
Transformation.prototype.addHelper = function(h) {
  if (_.every(['map', 'name'], x => _.has(h, x))) {
    this.helpers.push(h)
  } else {
    throw new TypeError(`Invalid helper: ${h}`)
  }
}

/** Add a set of transformation rules to a transformation module.
 *  @param {Object} helpers - the set of helpers, each key correspond to a helper.
 */
Transformation.prototype.addHelpers = function(helpers) {
  _.forEach(helpers, (helper, name) => {
    this.addHelper({name, map: helper})
  })
}

function Context() {
  this.generated = new Map()
  this.helpers = {}
  this.referencesResolutions = []
  this.generationLog = new Map()
}

Context.prototype.addResolution = function(r) {this.referencesResolutions.push(r)}

Context.prototype.assign = function(element, relationName, populators) {
  this.addResolution(new ReferenceResolution(element, relationName, populators))
}

/** @constructor
 * A transformation rule
 *  @param {function} selection - a function that will take a inputModel in input to output a set of elements
 *        that must be implied in this transformation.
 *  @param {function} out - A function that take an element of the selection and (optionally) the input model in parameters
 *  and output an array of created elements.
 *  @param {string} [name] - The name of the rule, not used yet.
 */
function Rule(selection, out, name) {
  /** @member {function} in */
  this.in = selection
  /** @member {function} out */
  this.out = out
  /** @member {string} name */
  this.name = name
}

function runRule(rule, context, inputModel, outputModel, extractMapping) {
  const selection = rule.in.call(context, inputModel)
  _.forEach(selection, function(e) {
    const generated = rule.out.call(context, e, inputModel)
    const value = (context.generated.get(e) || [])
    context.generated.set(e, value.concat(generated))
    if (extractMapping) {
      _.forEach(generated, function(x) {
        context.generationLog.set(x, {rule, source: e})
      })
    }
    _.forEach(generated, x => outputModel.addModellingElement(x))
  })
}

/** @constructor
 *  @param {Function} generation - A function that will be applied on an input model
 *  @param {string} name - the name of the helper, that will be used to reference the helper when we need it.
 */
function Helper(generation, name) {
  this.map = generation
  this.name = name
}

function runHelper(helper, context, inputModel) {
  const generated = helper.map.call(context, inputModel)
  context.helpers[helper.name] = generated
}

/** @constructor
 * @param {Object} element - the element that will be modified by this resolution
 * @param {string} relationName - the name of the relation to populate
 * @param {Object[]} populators - the input model elements that should be resolved to populate the relation.
 */
function ReferenceResolution(element, relationName, populators) {
  this.source = element
  this.relationName = relationName
  this.target = populators
}

function runResolution(resolution, generated) {
  const relationType = resolution.source.conformsTo().getAllReferences()[resolution.relationName].type
  const referenceFunctionName = 'add' + resolution.relationName[0].toUpperCase() + resolution.relationName.slice(1)
  _.each(resolution.target,  // get the type of the target(s) of the relation element in the input model in order to...
    function(elem) {
      const values = generated.get(elem) || []
      _.each(values, target => {
        if (relationType === JSMF.JSMFAny
          || relationType === undefined
          || JSMF.hasClass(target, relationType)) {
          resolution.source[referenceFunctionName](target)
        }
      })
    })
}

/** Apply a trsnformation on an input model, and put generated elements in a given ouput model.
 * @param {Object} inputModel - The input model.
 * @param {Object} outputModel - The output model.
 * @param {boolean} extractMapping - Extract the mapping model during the transformation.
 * @returns Nothing if extractMapping is set to false, a Mapping model otherwise.
 */
Transformation.prototype.apply = function(inputModel, outputModel, extractMapping) {
  const ctx = new Context()
  outputModel = outputModel || new JSMF.Model('TransformationOutput')
  _.forEach(this.helpers, h => runHelper(h, ctx, inputModel))
  _.forEach(this.rules, r => runRule(r, ctx, inputModel, outputModel, extractMapping))
  _.forEach(ctx.referencesResolutions, r => runResolution(r, ctx.generated))
  if (extractMapping) {
    return Mapping.buildMapping(ctx.generationLog, this)
  }
}

module.exports = {Helper, Rule, Transformation}
