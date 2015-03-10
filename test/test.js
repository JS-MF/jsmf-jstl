var assert = require("assert");
var should = require('should');
var JSMF = require('../JSMF_Prototype');
Class = JSMF.Class;
Model = JSMF.Model;

// ******************************
// Check M2 Level Instanciation
// ******************************
//2 ways of creating a JSMF Class and check conformance relation
describe('Create Class', function() {
	describe('NewInstanceMode', function(){
	it('Instance Created', function(done) {	
		var Instance = Class.newInstance('Instance');
		Instance.__name.should.equal('Instance');
		done();
		
		})
		it('Instance ConformsTo Class', function(done) {	
		var Instance = Class.newInstance('Instance');
		Instance.conformsTo().should.equal(Class);
		done();	
		})
	})
	describe('Old Way', function(){
	it('Instance Created', function(done) {	
		var InstanceOld = new Class('InstanceOld');
		InstanceOld.__name.should.equal('InstanceOld');
		done();
		})
	})	
})

// Create Attributes and check types, values
describe('Create Class Elements', function() {
	describe('Create Attribute', function() {
		it('Attributes Created With primitve types', function(done){
			var State = Class.newInstance('State');
			State.__attributes.should.be.empty;
			State.setAttribute('name', String);
			State.setAttribute('id', Number);
			State.setAttribute('active', Boolean);
			State.__attributes.should.not.be.empty;
			//State.__attributes['name'].should.exist;
			State.__attributes['name'].should.equal(String);
			State.__attributes['id'].should.equal(Number);
			State.__attributes['active'].should.equal(Boolean);
			done();
		})
	})

	describe('Create References', function() {
		it('Simple association created', function(done){
			var State = Class.newInstance('State');
			var Transition = Class.newInstance('Transition');
			State.setReference('transition', Transition,1);
			State.__references.should.not.be.empty
			State.__references['transition'].type.should.equal(Transition);
			//State.transition
			done();
		})
	})
})

// Create and Check Instances

