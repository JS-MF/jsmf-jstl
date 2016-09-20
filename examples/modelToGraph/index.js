'use strict'

const JSTL = require('../../src/index')
const JSMF = require('jsmf-core')
const _ = require('lodash')

const Model = JSMF.Model
const Class = JSMF.Class

const Graph = new Class('Graph')
const Node = new Class('Node', [], {name: String, object: JSMF.JSMFAny})
Graph.addReference('nodes', Node)
const Edge = new Class('Edge', [], {name: String}, {source: Node, target: Node})
Graph.addReference('edges', Edge)

const GraphModel = new Model('GraphModel', {}, Graph, true)

const modelToGraph = new JSTL.Transformation()

modelToGraph.addHelpers({
  'allElements': function(m) {
    return _.flatten(_.values(m.modellingElements))
  },
  'elementName': function(m) {
    const result = new Map()
    const elems = _.flatten(_.values(m.modellingElements))
    _.forEach(elems, function(x, i) {
      result.set(x, x.conformsTo().__name + '_' + i)
    })
    return result
  }
})

modelToGraph.addRules({

  'Generate nodes': {
    in: function() {return this.helpers.allElements},
    out: function (x) {
      const n = new Node()
      n.object = x
      n.name = n.name || this.helpers.elementName.valuesFor(x)[0]
      return [n]
    }
  },

  'Generate edges': {
    in: function() {return this.helpers.allElements},
    out: function (x) {
      const edges = []
      for (var rName in x.conformsTo().references) {
        _.forEach(x[rName], function(r) {
          const e = new Edge()
          e.name = rName
          this.assign(e, 'source', x)
          this.assign(e, 'target', r)
          edges.push(e)
        })
      }
      return edges
    }
  }
})

module.exports = JSMF.modelExport(GraphModel)
module.exports.toGraph = function(source) {
  const result = new Model()
  const graph = new Graph()
  modelToGraph.apply(source, result)
  graph.nodes = result.modellingElements.Node || []
  graph.edges = result.modellingElements.Edge || []
  result.add(graph)
  return result
}
