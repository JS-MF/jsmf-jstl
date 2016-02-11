'use strict';

var should = require('should');
var _ = require('lodash');

describe('Transformation rules', function() {

    describe('simple transformation example', function() {

        it('provides the expected result', function(done) {
            var abPath = '../examples/ABExample/';
            var MM = require(abPath + 'MMABExamples');
            var M = require(abPath + 'MABExamples');
            var t = require(abPath + 'TransformationDeclaration');
            var bs = t.result.Filter(MM.B);
            bs.should.have.length(1);
            var ds = t.result.Filter(MM.D);
            ds.should.have.length(2);
            _.map(M.ma.Filter(MM.C), function(x) {return x.id;}).should.eql(_.map(ds, function(x) {return x.num;}));
            done();
        });

    });

    describe('family2Person transformation example', function() {

        it('provides the expected result', function(done) {
            var f2pPath = '../examples/Family2Person/';
            var MMF = require(f2pPath + 'MMFamily');
            var MF = require(f2pPath + 'MFamily');
            var MMP = require(f2pPath + 'MMPerson');
            var t = require(f2pPath + 'FamiliesToPerson');
            var bs = t.result.Filter(MMP.Male);
            bs.should.have.length(5);
            var ds = t.result.Filter(MMP.Female);
            ds.should.have.length(4);
            done();
        });

    });

});
