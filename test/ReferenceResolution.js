'use strict';

var should = require('should');
var JSMF = require('jsmf-core');
var JSTL = require('../index');
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

    it('can work copying with a copy of unchanged element', function(done) {
        var Person = new JSMF.Class('Person', [], {firstname: String, lastname: String});
        var Person_ = new JSMF.Class('Person_', [], {fullname: String});
        var Work = new JSMF.Class('Work', [], {name: String});
        Person.addReference('occupation', Work, 1);
        Person_.addReference('occupation', Work, 1);
        var Extra = new JSMF.Class('Extra');
        var w = new Work({name: 'carpenter'});
        var p = new Person({firstname: 'John', lastname: 'Doe', occupation: w});
        var e = new Extra();
        var m = new JSMF.Model('Test', {}, [p,w,e]);
        var res = new JSMF.Model('Result');
        var toFullname = {
            in: function(m) {return m.modellingElements.Person;},
            out: function(person) {
                var person_ = new Person_({fullname: person.firstname + ' ' + person.lastname});
                this.assign(person_, 'occupation', person.occupation);
                return [person_];
            }
        };
        var t = new JSTL.Transformation([toFullname], undefined, true);
        t.apply(m, res);
        res.modellingElements.Person_[0].occupation.should.eql([w]);
        res.modellingElements.should.not.have.property('Person');
        res.modellingElements.Extra.should.have.length(1);
        res.modellingElements.Work.should.have.length(1);
        done();
    });
});


