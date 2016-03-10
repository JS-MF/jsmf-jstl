'use strict';

var JSTL = require('../index');
var JSMF = require('jsmf-core');
var _ = require('lodash');
var should = require('should');

describe('Transformation', function() {

    it('can be initialized with rules', function(done) {
        var r = new JSTL.Rule(function(x) {}, function(y) {});
        var t = new JSTL.Transformation([r]);
        t.rules.should.have.length(1);
        done();
    });

    it('can be initialized with helpers', function(done) {
        var h = new JSTL.Helper(function() {}, 'Foo');
        var t = new JSTL.Transformation(undefined, [h]);
        t.helpers.should.have.length(1);
        done();
    });

    it('can be initialized with both', function(done) {
        var h = new JSTL.Helper(function() {}, 'Foo');
        var r = new JSTL.Rule(function(x) {}, function(y) {});
        var t = new JSTL.Transformation([r], [h]);
        t.rules.should.have.length(1);
        t.helpers.should.have.length(1);
        done();
    });

    it('works inplace', function(done) {
        var A = new JSMF.Class('A', [], {value: Number});
        var B = new JSMF.Class('B');
        A.setReference('foo', B);
        var b = new B();
        var a = new A({value: 41, foo: [b]});
        var m = new JSMF.Model('MyModel', {}, [a,b]);
        var t = new JSTL.Transformation();
        t.addRule({
            in: function(m) {return m.modellingElements.A},
            out: function(e) {
                var e_ = new A({value: e.value + 1});
                this.assign(e_, 'foo', e.foo);
                return [e_];
            }
        });
        t.apply(m);
        _.map(m.modellingElements.A, 'value').should.eql([42]);
        _.flatMap(m.modellingElements.A, 'foo')[0].should.eql(b);
        m.modellingElements.B[0].should.eql(b);
        done();
    });
});

describe('addHelper', function() {

    it('checks that the helper has a name', function(done) {
        var t = new JSTL.Transformation();
        var noName = {map: function() {}};
        (function() {t.addHelper(noName)}).should.throw();
        done();
    });

    it('checks that the helper has a map', function(done) {
        var t = new JSTL.Transformation();
        var noMap = {name: 'foo'};
        (function() {t.addHelper(noMap)}).should.throw();
        done();
    });
});

describe('addRule', function() {

    it('checks that the rule has a in field', function(done) {
        var t = new JSTL.Transformation();
        var noIn = {out: function() {}};
        (function() {t.addRule(noIn)}).should.throw();
        done();
    });

    it('checks that the rule has a out field', function(done) {
        var t = new JSTL.Transformation();
        var noOut = {in: function() {}};
        (function() {t.addRule(noOut)}).should.throw();
        done();
    });

});
