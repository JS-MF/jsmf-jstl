var xpath = require('xpath')
  , dom = require('xmldom').DOMParser;
var fs = require('fs');
var JSMF = require('./JSMF_Prototype'); var Model = JSMF.Model; var Class = JSMF.Class;
var _ = require('underscore');
var inspect = require('eyes').inspector({maxLength: 9000});

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


var domainFile = __dirname + '/'+ '/HealthModeling.txt'

fs.readFile(domainFile, {encoding: "UTF-8"}, function(err, data) {
	//console.log(data)
//GENERATE XPATH Parser from M2
	var doc = new dom().parseFromString(data)
	var nodes = xpath.select("//element", doc); // WARNING element => not generic should be read from metamodel
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
								} // WARNING Check for unresolved references!
							}); //element not found? 
						});
				}
				ArchiSante.setModellingElement(s); 
			}
		}
	}
	
// Save Model to the DB - WARNING currently it is not updating but duplicating nodes into DB!!!!!
ArchiSante.save();	

// WARNING IN CASE OF NON RESOLVABLE REFERENCE use XPATH, KEEP THE LINKS OF UNDEFINED ELEMENT AND RESOLVE THEM AT THE END.	
//console.log(idReference);
	/* get element with Xpath... but is it necessary? yes maybe for element that have not been created yet!
		var referencedNodes = xpath.select("//element[@id='"+idReference+"']",doc); //===> select by ID ?
		var IdRef = referencedNodes[0].getAttribute("id");
	*/	
// END WARNING	
});