var xpath = require('xpath')
  , dom = require('xmldom').DOMParser;
var fs = require('fs');
var JSMF = require('./JSMF_Prototype'); var Model = JSMF.Model; var Class = JSMF.Class;
var _ = require('underscore');
var inspect = require('eyes').inspector({maxLength: 9000});

function importArchi(filepath){
    var ModelE = [];

    //Build ArchiMateMetamodel => should be built from M2.ecore file (and restricted to elements of interests - reduced viewpoint).
    var M2Archi= new Model("Archi");
    var BusinessActor = new Class("BusinessActor");
    BusinessActor.setAttribute("name", String);
    BusinessActor.setAttribute("id", String);
    ModelE.push(BusinessActor);
    var BusinessRole = new Class("BusinessRole");
    BusinessRole.setAttribute("name", String);
    BusinessRole.setAttribute("id", String);
    ModelE.push(BusinessRole);
    var BusinessService = new Class ("BusinessService");
    BusinessService.setAttribute("name", String);
    BusinessService.setAttribute("id", String);
    ModelE.push(BusinessService);
    var BusinessFunction = new Class ("BusinessFunction");
    ModelE.push(BusinessFunction);
    BusinessFunction.setAttribute("name", String);
    BusinessFunction.setAttribute("id", String);
    var BusinessObject = new Class ("BusinessObject");
    BusinessObject.setAttribute("name", String);
    BusinessObject.setAttribute("id", String);
    ModelE.push(BusinessObject);

//Added since version 0.6
var DataObject = new Class("DataObject");
DataObject.setAttribute("name", String);
DataObject.setAttribute("id", String);
ModelE.push(DataObject);

var ApplicationComponent = new Class("ApplicationComponent");
ApplicationComponent.setAttribute("name", String);
ApplicationComponent.setAttribute("id", String);
ModelE.push(ApplicationComponent);

var Contract = new Class("Contract");
Contract.setAttribute("name",String);
Contract.setAttribute("id", String);
ModelE.push(Contract);
//End version 0.6

var Driver = new Class ("Driver");
Driver.setAttribute("name", String);
Driver.setAttribute("id", String);
ModelE.push(Driver);
var Goal = new Class ("Goal");
Goal.setAttribute("name", String);
Goal.setAttribute("id", String);
ModelE.push(Goal);
var Assessment = new Class ("Assessment"); //Assessment
Assessment.setAttribute("name", String);
Assessment.setAttribute("id", String);
ModelE.push(Assessment);

    var AggregationRelationship = new Class ("AggregationRelationship");
    AggregationRelationship.setAttribute("id", String);
    AggregationRelationship.setReference("source", Class, 1);
    AggregationRelationship.setReference("target", Class, 1);
    ModelE.push(AggregationRelationship);
    var CompositionRelationsship = new Class ("CompositionRelationship");
    CompositionRelationsship.setReference("source", Class, 1);
    CompositionRelationsship.setReference("target", Class, 1);
    ModelE.push(CompositionRelationsship);
    var InfluenceRelationship = new Class ("InfluenceRelationship");
    InfluenceRelationship.setReference("source", Class, 1);
    InfluenceRelationship.setReference("target", Class, 1);
    ModelE.push(InfluenceRelationship);
    var AssociationRelationship = new Class ("AssociationRelationship");
    AssociationRelationship.setReference("source", Class, 1);
    AssociationRelationship.setReference("target", Class, 1);
    ModelE.push(AssociationRelationship);
    var SpecialisationRelationship  = new Class ("SpecialisationRelationship");
    SpecialisationRelationship.setReference("source", Class, 1);
    SpecialisationRelationship.setReference("target", Class, 1);
    ModelE.push(SpecialisationRelationship);
    var AssigmentRelationship = new Class("AssignmentRelationship");
    AssigmentRelationship.setReference("source", Class, 1);
    AssigmentRelationship.setReference("target", Class, 1);
    ModelE.push(AssigmentRelationship);
    var AccessRelationship = new Class ("AccessRelationship");
    AccessRelationship.setReference("source", Class, 1);
    AccessRelationship.setReference("target", Class, 1);
    ModelE.push(AccessRelationship);
    var UsedByRelationship = new Class ("UsedByRelationship");
    UsedByRelationship.setReference("source", Class, 1);
    UsedByRelationship.setReference("target", Class, 1);
    ModelE.push(UsedByRelationship);

    M2Archi.setModellingElements(ModelE);

    for(i in M2Archi.modellingElements) {
        M2Archi.modellingElements[i].setAttribute("id",String);
    }

    var ArchiSante= new Model("ArchimateSante");
    ArchiSante.setReferenceModel = M2Archi;

//Path to the Archi Model File (XMI)
//var domainFile = __dirname + '/'+ '/HealthModeling.txt'
//var domainFile = __dirname + '/'+ 'HealthModelingv6.archimate';
var domainFile = filepath;

fs.readFile(domainFile, {encoding: "UTF-8"}, function(err, data) {
//GENERATE XPATH Parser from M2
	var doc = new dom().parseFromString(data)
	var nodes = xpath.select("//element", doc); // WARNING elemen hard-wired (not a generic EMF term)
	for(i in M2Archi.modellingElements) {
		var findName = "archimate:"; //WARNING archimate: => should be generated from metamodel
		var currentClass = M2Archi.modellingElements[i];
		var ClassName = M2Archi.modellingElements[i].__name;
		findName += ClassName;
		for (var i in nodes) {
			var currentType = nodes[i].getAttribute("xsi:type"); //generic?
			if(currentType == findName) {
				//console.log(currentType, findName);
				var s = currentClass.newInstance("x");
				for(it in currentClass.__attributes) {
					functionName = "set"+it; //- creating the name of the method to be called
					s[functionName](nodes[i].getAttribute(it));  // <=> setAttribute(Value)
				}
				for(it in currentClass.__references) {
					referenceFunctionName = "set"+it;
					var idReference = nodes[i].getAttribute(it);
					_.each(ArchiSante.modellingElements, 
						function(element,index,list) { 
							_.each(element,
							function(el2,ind2,list2) {
								if(el2.id == idReference) {
									s[referenceFunctionName](el2);
								} // WARNING also Check for unresolved references!
							}); //What if element not found? 
						});
				}
				ArchiSante.setModellingElement(s); 
			}
		}
	}
// WARNING IN CASE OF NON RESOLVABLE REFERENCE use XPATH, KEEP THE LINKS OF UNDEFINED ELEMENT AND RESOLVE THEM AT THE END.	
//console.log(idReference);
	/* get element with Xpath... but is it necessary? yes maybe for element that have not been created yet!
		var referencedNodes = xpath.select("//element[@id='"+idReference+"']",doc); //===> select by ID ?
		var IdRef = referencedNodes[0].getAttribute("id");
	*/	
// END WARNING	
	
	
// Save Model to the DB - WARNING currently it is not updating but duplicating nodes into DB!!!!!
//ArchiSante.save();
	
// REFACTORING of model to passe from: Source <- Relation -> Target to Source -> Target
var RefactoredM2Archi = new Model("ArchiRefactored");
var ArchiSanteRefactored = new Model("ArchiSanteRefactored");
    ArchiSanteRefactored.setReferenceModel(RefactoredM2Archi);
    //console.log(ArchiSanteRefactored);
    var TabResolution = [];
    var LinkResolve={};

    _.each(ArchiSante.modellingElements,
    function(element, index,list){
        _.each(element, 
        function(el1,ind1,list1) {
            //console.log(index,el1);
            if(el1.source!=undefined && el1.target!=undefined) {
                var sourceOb = el1.source[0];
                var targetOb = el1.target[0]; //association of card = 1 so take the first element: [0];
                //modify the metamodel in order to add the relation
                var M2source = sourceOb.conformsTo(); // 
                M2source.setReference(index,targetOb.conformsTo(),-1);
                var newObject = M2source.newInstance("T");

                //Assign the value to the newobject (do not use newObject = sourceOb);
                ModelCopy(sourceOb,newObject);

                LinkResolve= {
                            origin:sourceOb,
                            target:newObject, 
                            reference:index,
                            referee:targetOb
                            };

                TabResolution.push(LinkResolve);
                //if not already present add it to the model refactored
                var Z = isPresent(newObject, ArchiSanteRefactored);
                if(Z!=undefined) {
                    //Do nothing 
                    console.log("Present!");
                } else {
                    ArchiSanteRefactored.setModellingElement(newObject);
                }
            } 
        });		//4 Add the reference to the new model			
                //ArchiSanteRefactored.setModellingElement(newObject); //that is not erasing the other elements		
    });	

 MatchedSources = [];
 MatchedSources = _.map(TabResolution, function(source) { 
        return source.origin;
    });

MatchedM2 = [];
MatchedM2= _.map(TabResolution, function(source) { 
	return source.target.conformsTo();
});
    
    
_.each(TabResolution, 
	function(el1,ind1) {
	//search for existing OR transforms$
	functionName = "set"+el1.reference;
	if(_.contains(MatchedSources,el1.referee)) {
		targeted= _.find(TabResolution, function(current) {
			if(current.origin==el1.referee) { return current;}
		});
			//console.log(targeted.target);
		el1.target[functionName](targeted.target);
	//The object is not yet transformed in the new metamodel (Leaf of associations)
	} else {
		//console.log("LeafObject");
		//target must of an instance of the new metamodel
		M2target=_.find(MatchedM2, function(current) { 
			return current.__name == el1.referee.conformsTo().__name;
		});
        
        //Warning patch for V0.6
        if(M2target==undefined) {M2target=ApplicationComponent;}
		newTarget= M2target.newInstance("newtarget");
		ModelCopy(el1.referee,newTarget);
		el1.target[functionName](newTarget);
		ArchiSanteRefactored.setModellingElement(newTarget);
	}
	
});

    _.each(TabResolution, 
        function(el1,ind1) {
        //search for existing OR transforms$
        functionName = "set"+el1.reference;
        if(_.contains(MatchedSources,el1.referee)) {
            targeted= _.find(TabResolution, function(current) {
                if(current.origin==el1.referee) { return current.target;}
            });
                //console.log(targeted.target);
            el1.target[functionName](targeted.target);
        //The object is not yet transformed in the new metamodel (Leaf of associations)
        } else {
            //console.log("LeafObject");
            //target must of an instance of the new metamodel
            M2target=_.find(MatchedM2, function(current) { 
                return current.__name == el1.referee.conformsTo().__name;
            });
            newTarget= M2target.newInstance("newtarget");
            ModelCopy(el1.referee,newTarget);
            el1.target[functionName](newTarget);
            ArchiSanteRefactored.setModellingElement(newTarget);
        }

    });

    //WARNING address Objects non matched!!!

    //Save Refactored model
    ArchiSanteRefactored.save();

    });
}

//Change it by a boolean expression...
function isPresent(ModelElement, TModel) {
	//Create the indexM for getting just the subset of elements that have the same (meta)type of ModelElement (i.e., indexation by metaclass name)
		var indexM = ModelElement.conformsTo().__name;
		var result= _.find(TModel.modellingElements[indexM],
			function(current){ 
				return current == ModelElement;
			});
		return result;			
}

//Should be REPORTED AS HELPER or JSMF_UTIL IN JSMF PROTOTYPE
//Copy the element which are the same from sourceME to targetME without changing the metaclass of Source and Target elements
function ModelCopy(SourceME,TargetME) {
	_.each(SourceME.conformsTo().__attributes, function(element,index,list) {
		if(TargetME.hasOwnProperty(index)) {
			 var setValue = "set"+index;
			TargetME[setValue](SourceME[index]); // or TargetME[index]=SourceME[index] => prefere the current solution because its check name unicity and attribute types!
		}
	});
	//DO the same for the references
	//_.each(SourceME.conformsTo()._references, function(element,index,list) { 
	// DO the affectation of references elements
	//});
}


function Remove(TModel, ModelElement) {
	var indexM2 = ModelElement.conformsTo().__name;
	var indexRM=_.indexOf(TModel.modellingElements[indexM2],ModelElement);
	console.log(indexRM);
		TModel.modellingElements[indexM2].splice(indexRM,1);
}

exports.importArchi = importArchi;
