'use strict';

var should = require('should');
var JSMF = require('jsmf-core');
var JSTL = require('../src/index');
var _ = require('lodash');

describe('References resolution', function() {
    it('accept any jsmf object for references with any type', function(done) {
        var Foo = new JSMF.Class('Foo', [], {}, {foo: {target: JSMF.JSMFAny}});
        var BarSource = new JSMF.Class('BarSource', [], {x: Number});
        var BarTarget = new JSMF.Class('BarTarget', [], {y: Number});
        var trans = new JSTL.Transformation();
        trans.addRule({
          in: function(m) {return m.modellingElements.Foo;},
          out: function(e) {
            var res = new Foo();
            this.assign(res, 'foo', e.foo);
            return [res];
          }
        });
        trans.addRule({
          in: function(m) {return m.modellingElements.BarSource;},
          out: function(e) {
            var res = new BarTarget({y: e.x});
            return [res];
          }
        });
        var f = new Foo({foo: [new BarSource({x: 42})]});
        var src = new JSMF.Model('src', {}, [f], true);
        var target = new JSMF.Model('target');
        trans.apply(src, target);
        target.modellingElements.BarTarget.should.not.be.empty();
        target.modellingElements.Foo[0].foo.should.have.length(1);
        done();
    });
});


