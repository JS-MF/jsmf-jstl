'use strict';

var JSTL = require('../../index');
var JSMF = require('jsmf-core');
var _ = require('lodash');

var Model = JSMF.Model;
var Class = JSMF.Class;

var Graph = new Class('Graph');
var Node = new Class('Node', [], {name: String});
Graph.addReference('nodes', Node);
var Edge = new Class('Edge', [], {name: String, sourcee: String, target: String});
Graph.addReference('edges', Edge);

var GraphModel = new Model('GraphModel', {}, Graph, true);

var modelToGraph = new JSTL.Transformation();

var elementName = {
    name: 'elementName',
    map: function(m) {
        var result = new JSTL.Mapping();
        var elems = _.flatten(_.values(m.modellingElements));
        _.forEach(elems, function(x, i) {
            result.map(x, x.conformsTo().__name + '_' + i);
        })
        return result;
    }};
modelToGraph.addHelper(elementName);

modelToGraph.addRule({
    name: 'Generate nodes',
    in: function(m) {return _.flatten(_.values(m.modellingElements));},
    out: function (x) {
        var n = new Node();
        _.forEach(x.conformsTo().attributes, function(aName) {
            var value = x[aName];
            n[aName] = value === undefined ? undefined : value.toString();
        });
        n.name = n.name || this.helpers.elementName.valuesFor(x)[0];
        return [n];
    }
});

modelToGraph.addRule({
    name: 'Generate edges',
    in: function(m) {return _.flatten(_.values(m.modellingElements));},
    out: function (x) {
        var edges = [];
        for (var rName in x.conformsTo().references) {
            _.forEach(x[rName], function(r) {
                var e = new Edge();
                e.name = rName;
                e.source = JSMF.jsmfId(x);
                e.target = JSMF.jsmfId(r);
                edges.push(e);
            });
        }
        return edges;
    }
});

module.exports = JSMF.modelExport(GraphModel);
module.exports.toGraph = function(source) {
    var result = new Model();
    var graph = new Graph();
    modelToGraph.apply(source, result);
    graph.nodes = result.modellingElements.Node || [];
    graph.edges = result.modellingElements.Edge || [];
    result.add(graph)
    return result;
}
