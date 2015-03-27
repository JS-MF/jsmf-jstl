var assert = require("assert");
var should = require('should');
var JSMF = require('../../JSMF_Prototype');
Class = JSMF.Class;
Model = JSMF.Model;

//var modelDB = require('../JSMFNeo4j.js'); 
 

describe('Create Model Elements and Persist', function() {
    describe('Elment (no relation) persistence', function() {
        it('Simple Model Element Persisted', function(done){
            var referenceModel = new Model('FSM');
		    var State = Class.newInstance('State');
			State.setAttribute('name', String);
			State.setAttribute('id', Number);
             
            referenceModel.setModellingElement(State);
            
            var StateMachine1 = new Model('MyFSM');
            StateMachine1.setReferenceModel(referenceModel);
			var s1 = State.newInstance('s1');
			s1.conformsTo().should.equal(State);

			//attributes have been set
			s1.should.have.property('name');
			s1.should.have.property('id');

			//attributes values have been set
			s1.setname('s1');
			s1.setid(12);
			s1.should.have.property('name','s1');
			s1.should.have.property('id',12);
			
			//Rewritting values
			s1.setname('news1');
			s1.should.have.property('name','news1');
			s1.should.not.have.property('name','s1');			

            StateMachine1.setModellingElement(s1);
            
            // Save the model in Neo4J DB
            StateMachine1.save();
            
            // Assess if the element as ID in DB.
            StateMachine1.getPersistedID(s1).should.be.ok;
            
            //Cypher query for getting back attributes and values?
            
            //Clean the DB
            
			done();
		})
        
        it('Multiple Model Elements Persisted', function(done){
            var referenceModel = new Model('');
		    var AComponent = Class.newInstance('Abstract Component');
			AComponent.setAttribute('composable', Boolean);
			AComponent.setAttribute('id', Number);
            var Component = Class.newInstance('Component');
            Component.setAttribute('name', String);
            
            referenceModel.setModellingElements([AComponent, Component]);
            
            var Composition = new Model('Composition');
            Composition.setReferenceModel(referenceModel);
			var s1 = AComponent.newInstance('s1');
			s1.conformsTo().should.equal(AComponent);

			//attributes values have been set
			s1.setcomposable(true);
			s1.setid(12);
			s1.should.have.property('composable',true);
			s1.should.have.property('id',12);

            t0 = Component.newInstance('t0');
            t0.setname('myto');
            
            Composition.setModellingElement([s1,t0]);
            
            // Save the model in Neo4J DB
            //Composition.save();
            
            // Assess if the element as ID in DB.
            //Composition.getPersistedID(s1).should.be.ok;
            
			done();
		})
    })
})
