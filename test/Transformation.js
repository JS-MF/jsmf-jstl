'use strict';

const JSTL = require('../src/index');
const should = require('should');

describe('Transformation', function() {

  it('can be initialized with rules', function(done) {
    const r = new JSTL.Rule(function(x) {}, function(y) {});
    const t = new JSTL.Transformation([r]);
    t.rules.should.have.length(1);
    done();
  });

  it('can be initialized with helpers', function(done) {
    const h = new JSTL.Helper(function() {}, 'Foo');
    const t = new JSTL.Transformation(undefined, [h]);
    t.helpers.should.have.length(1);
    done();
  });

  it('can be initialized with both', function(done) {
    const h = new JSTL.Helper(function() {}, 'Foo');
    const r = new JSTL.Rule(function(x) {}, function(y) {});
    const t = new JSTL.Transformation([r], [h]);
    t.rules.should.have.length(1);
    t.helpers.should.have.length(1);
    done();
  });

});

describe('addHelper', function() {

  it('checks that the helper has a name', function(done) {
    const t = new JSTL.Transformation();
    const noName = {map: function() {}};
    (function() {t.addHelper(noName)}).should.throw();
    done();
  });

  it('checks that the helper has a map', function(done) {
    const t = new JSTL.Transformation();
    const noMap = {name: 'foo'};
    (function() {t.addHelper(noMap)}).should.throw();
    done();
  });
});

describe('addRule', function() {

  it('checks that the rule has a in field', function(done) {
    const t = new JSTL.Transformation();
    const noIn = {out: function() {}};
    (function() {t.addRule(noIn)}).should.throw();
    done();
  });

  it('checks that the rule has a out field', function(done) {
    const t = new JSTL.Transformation();
    const noOut = {in: function() {}};
    (function() {t.addRule(noOut)}).should.throw();
    done();
  });

});
