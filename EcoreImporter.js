var xpath = require('xpath')
  , dom = require('xmldom').DOMParser;
var fs = require('fs');
var JSMF = require('./JSMF_Prototype'); var Model = JSMF.Model; var Class = JSMF.Class;
var _ = require('underscore');
var inspect = require('eyes').inspector({maxLength: 900});
var xml2js = require('xml2js');

var ModelImport = [];

var metaModelFile = __dirname + '/'+ '/TDA.ecore';
var modelFile = __dirname + '/' + 'TDA2.xmi';

var parser = new xml2js.Parser();

var InjectMetaModel = new Model("Injected");

fs.readFile(metaModelFile, {encoding: "UTF-8"}, 
function(err, data) {
	parser.parseString(data, function (err, domain) {
		_.each(domain,function(element,index,list) { 
			_.each(element.eClassifiers, function(el1,ind1,list1) {
				var Local = el1.$;
				//if(local.xsi:type=='Ecore:EClass') { // ECLass vs EEnum
				var MElem = new Class(Local.name);
				_.each(el1.eStructuralFeatures, function(att2,ind2,list2) {
					var sFeature = att2.$;
					//console.log(sFeature['xsi:type']);
					switch(sFeature['xsi:type']) { //ADD the other Types ENum, etc...
					case 'ecore:EAttribute':
						var featureType = _.last(sFeature.eType.split('//'));
						var JSMFType='';
						switch(featureType) {
							case "EString": 
								JSMFType = String;
							break;
							case "EInt":
								JSMFType = Number;
							break;
							case "EBoolean":
								JSMFType = Boolean;
							break;
							//WARNING : no else cases
						}
						if(JSMFType =='') {
							JSMFType = String; //By default put a String 
							//console.log("Warning: no type or not idenfied type");
						}
						MElem.setAttribute(sFeature.name, JSMFType);
					break;
					case 'ecore:EReference' :
						var referenceType = _.last(sFeature.eType.split('//'));
						var card = sFeature.upperBound; //=> TO number
                        var composite = sFeature.containment;
						if(card==undefined) {card=1;}
						//resolve reference type after the creation of all classes? 
                        composite = (composite!== undefined)?true:false;
                        // referenceType is a proxy of the type which has to be resolve with the real metaclass
						MElem.setReference(sFeature.name, referenceType, card,undefined,composite); // TO BE set : eOpposite	
					break;	
					}
				});
               
				InjectMetaModel.setModellingElement(MElem);
			});
		});
	});
	resolveReference(InjectMetaModel);
	//resolveInheritance(InjectModel);
	//inspect(InjectMetaModel);
	
	var injectedmodel = new Model("TDA");
	injectedmodel.setReferenceModel(InjectMetaModel);
    //console.log(InjectMetaModel);
	var rootMetaModelElement = InjectMetaModel.modellingElements['TDAModel'][0];
    //console.log(rootMetaModelElement);
	var uri = 'lu.tudor.tda:';
    var rootModeELement = rootMetaModelElement.newInstance('root');
	fs.readFile(modelFile, {encoding: "UTF-8"}, 
	function(err, data) {
		var doc = new dom().parseFromString(data);
		buildModelFromRef(doc,injectedmodel,rootModeELement);
		//inspect(nodes);
	});
	
});

//
function buildModelFromRef(doc, modelT,currentElement) { 
    //console.log(currentElement);
    var currentM2Element = currentElement.conformsTo();
    _.each(currentM2Element.__references, function(elem,index) {
        if(elem.composite==true) {
            //console.log(index, elem);
            var getName = "//"+index;
            nodes = xpath.select(getName, doc);
            //for each nodes given by xpath query
            for( var i in nodes) {
                
                //Get the class referenced by the current reference index (i.e., type of reference)
                var referencedM2Class = currentM2Element.__references[index].type;
                console.log(referencedM2Class[0].__references);
                
                //Create a new modelling element for the current reference index
                var addedElement = referencedM2Class[0].newInstance("a");
                    
                //set the model  (attributes)
                 _.each(elem.type.__attributes, function(el1,ind1) {
                     var setterfunction = "set"+ind1;
                    addedElement[setterfunction](nodes[i].getAttribute(ind1));
                });
               //console.log(addedElement.name);
                var associationFunction = "set"+index;
                
                //create the relation between currentElement and referenced element
                currentElement[associationFunction](addedElement);
                
                //Save the added element to the model
                modelT.setModellingElement(addedElement);
                
                // Recursive Call (for each referenced element which are containement references)
                buildModelFromRef(doc,modelT,addedElement);
            }
        } 
    });
}

//model
function resolveReference(model) { //refModels
	var listName= [];
	for(z in model.modellingElements) {
		listName.push(model.modellingElements[z][0].__name);
	}
	for(i in model.modellingElements) {
		var currentElement = model.modellingElements[i][0];
		for(e in currentElement.__references) {
			var currentRef = currentElement.__references[e]; //WARNING current Ref can be instance of Array
			// the element is present in the current Model
				var realType = _.find(model.modellingElements,function(current) {return current[0].__name ==currentRef.type;}); //warning find the first that match, by name
				if(realType == undefined) {
					// create a proxy element (the referenced model element is present in another model?)
					console.log("modelling element not present in loaded models");
				} else {
					// current element is only a reference to the real element in the model
					//console.log(e,currentRef);
					model.modellingElements[i][0].setReference(e,realType,currentRef.card,undefined,currentRef.composite); //currentRef.opposite
				}
		}
	}
}

//function getAttribute()