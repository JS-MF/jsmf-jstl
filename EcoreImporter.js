/**
 *  Importer of Ecore files (Metamodel+Model)
 *
©2015 Luxembourg Institute of Science and Technology All Rights Reserved
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

Authors : J.S. Sottet
*/


/* *********************************
    -Ecore
        - packages
        - multimodels references
    -  M2
        - Resolve Inheritance
        - Add enum types
        - Add other datatypes
    - M1
        - Resolve Reference (using Xpath)
******************************************/

var xpath = require('xpath.js')
  , dom = require('xmldom').DOMParser;
var fs = require('fs');
//var libxmljs = require("libxmljs");
var JSMF = require('./JSMF_Prototype'); var Model = JSMF.Model; var Class = JSMF.Class;
var _ = require('lodash');
var inspect = require('eyes').inspector({maxLength: 10900});
var xml2js = require('xml2js');
var cheerio = require('cheerio');

var ModelImport = [];

var metaModelFile = __dirname + '/'+ '/TDA.ecore';
var modelFile = __dirname + '/' + 'TDA2.xmi';

//var metaModelFile = __dirname + '/'+ 'JQueryMobile.ecore';
//var modelFile = __dirname + '/' + 'jqm.xmi';

var parser = new xml2js.Parser();

var InjectMetaModel = new Model("Injected");

fs.readFile(metaModelFile, {encoding: "UTF-8"}, 
function(err, data) {
	parser.parseString(data, function (err, domain) {
		_.each(domain,function(element,index,list) { 
			_.each(element.eClassifiers, function(el1,ind1,list1) { //check for packages
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
							//WARNING : no else cases, enumeration, etc...
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
	
	var injectedmodel = new Model("TDA");
	injectedmodel.setReferenceModel(InjectMetaModel);

	var rootMetaModelElement = InjectMetaModel.modellingElements['TDAModel'][0];
    //var rootMetaModelElement = InjectMetaModel.modellingElements['PageHeader'][0];
    
   //WARNING: hould read the first node instead of creating it from nothing..
	var uri = 'lu.tudor.tda:';
    var rootModeELement = rootMetaModelElement.newInstance('root');
    rootModeELement.setname('Root');
   // rootModeELement.settitle('ActorSearch');
	fs.readFile(modelFile, {encoding: "UTF-8"}, 
	function(err, data) {
		var doc = new dom().parseFromString(data);
		buildModelFromRef(doc,injectedmodel,rootModeELement);
            //resolveInstanceReference(injectedmodel,doc,rootModeELement);
        //injectedmodel.save();
		//inspect(injectedmodel);
	});
	
});

//Build a ref xmlpath<->JSMF_Instance?
// use cheerio here
function buildModelFromRef(doc, modelT,currentElement) { 
    //console.log(currentElement);
    var currentM2Element = currentElement.conformsTo();
    var addedElement = {};
    _.each(currentM2Element.__references, function(elem,index) {
        if(elem.composite==true) {
           // console.log(index);
            var getName = "./"+index; //use cheerio instead
             nodes = xpath(doc,getName); //originally xpath.select(getname,doc);
            //for each nodes given by xpath query -> should be the right elements at the right level and not all the element as it is now...
            
            for( var i in nodes) {
                   
                //Get the class referenced by the current reference index (i.e., type of reference)
                var referencedM2Class = currentM2Element.__references[index].type;
                
                //Create a new modelling element for the current reference index
                addedElement = referencedM2Class[0].newInstance("a");
                    
                //set the model  (attributes)
                 _.each(referencedM2Class[0].__attributes, function(el1,ind1) {
                     var setterfunction = "set"+ind1;
                    if(nodes[i]==undefined) {console.log('undefined xml node for: ', ind1, index)} 
                     else {
                        var attributevalue= nodes[i].getAttribute(ind1);
                        // set the attribute calling the setter function from a setter String
                        addedElement[setterfunction](attributevalue);
                     }
                });
               //console.log(addedElement.name);
                var associationFunction = "set"+index;
                
                //create the relation between currentElement and referenced element
                currentElement[associationFunction](addedElement);
                
                //Save the added element to the model
                modelT.setModellingElement(addedElement);
                
               // console.log(currentElement.name);
                //console.log(addedElement.type, addedElement.name, index);
                
                // Recursive Call (for each referenced element which are containement references)
                buildModelFromRef(nodes[i],modelT,addedElement);
            }
        }
        //standard Ecore Reference to be resolve later
        else {
            var getName = ".";
             nodes = xpath(doc,getName);
            console.log(index, elem); 
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

function resolveInheritance(model){
    var
    
}


function resolveInstanceReference(model,doc,currentModelElement) {
    var currentM2Element = currentModelElement.conformsTo();
    var addedElement = {};
    
    
    
    _.each(currentM2Element.__references, function(elem,index) {
        console.log('current',index);
        if(elem.composite==false) {
            console.log(elem);
        }
    });
}
