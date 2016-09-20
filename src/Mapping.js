/** @license
 *
 *   JavaScript Modelling Framework (JSMF)
 *
©2015-2016 Luxembourg Institute of Science and Technology All Rights Reserved
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

Authors : J.S. Sottet, A Vagner, N. Biri
Contributors: G. Garcia-Frey

*/
const _ = require('lodash')
const JSMF = require('jsmf-core')

const ElementMapping = new JSMF.Class('ElementMapping', [], {},
  { source: {type : JSMF.JSMFAny, cardinality: JSMF.Cardinality.one}
  , target: {type : JSMF.JSMFAny, cardinality: JSMF.Cardinality.one}
  })

const Rule = new JSMF.Class('Rule', [], {name: String, in: JSMF.Function, out: JSMF.Function})
ElementMapping.addReference('rule', Rule, JSMF.Cardinality.one)

const Mapping = new JSMF.Model('Mapping', undefined, [ElementMapping, Rule])

function generateRule(acc, rule) {
  acc.set(rule, new Rule(rule))
  return acc
}

function generateRules(transformation) {
  return _.reduce(transformation.rules, generateRule, new Map())
}

function generateElementMappings(mapObjects, rules) {
  let result = []
  for (let [target, m] of mapObjects.entries()) {
    result.push(new ElementMapping({source: m.source, target, rule: rules.get(m.rule)}))
  }
  return result
}

function buildMapping(mapObjects, transformation) {
  const rules = generateRules(transformation)
  const elementMappings = generateElementMappings(mapObjects, rules)
  return new JSMF.Model('MappingModel', undefined, Array.from(rules.values()).concat(elementMappings))
}

module.exports = _.assign({buildMapping}, JSMF.modelExport(Mapping))
