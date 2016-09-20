'use strict'

const should = require('should')
const _ = require('lodash')

describe('Transformation rules', function() {

  describe('simple transformation example', function() {

    it('provides the expected result', function(done) {
      const abPath = '../examples/ABExample/'
      const MM = require(abPath + 'MMABExamples')
      const M = require(abPath + 'MABExamples')
      const t = require(abPath + 'TransformationDeclaration')
      const bs = t.result.Filter(MM.B)
      bs.should.have.length(1)
      const ds = t.result.Filter(MM.D)
      ds.should.have.length(2)
      _.map(M.ma.Filter(MM.C), x => x.id).should.eql(_.map(ds, x => x.num))
      done()
    })

  })

  describe('family2Person transformation example', function() {

    it('provides the expected result', function(done) {
      const f2pPath = '../examples/Family2Person/'
      const MMF = require(f2pPath + 'MMFamily')
      const MF = require(f2pPath + 'MFamily')
      const MMP = require(f2pPath + 'MMPerson')
      const t = require(f2pPath + 'FamiliesToPerson')
      const bs = t.result.Filter(MMP.Male)
      bs.should.have.length(5)
      const ds = t.result.Filter(MMP.Female)
      ds.should.have.length(4)
      done()
    })

  })

})
