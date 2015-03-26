/* **************************************
TODO:
    - add logger
    - make a version with batch processing
    - read from DB
    - update nodes/model
*************************************** */
var serverURL = "http://localhost:7474";
var neo4j = require('node-neo4j');
var async = require("async");
db = new neo4j(serverURL);
var inspect = require('eyes').inspector({maxLength: 9000});

var ids = [];

module.exports = {
//Function Create Node From Model Element
persist: function (ModelElement) {
// MetaModel, Model(container) as labels
	createNode(ModelElement);
},

resolve: function(ModelElement) {
	resolveIdFromModelElement(ModelElement);
},

deleteElement : function(ModelElement){
	deleteAllNodes(ModelElement);
},

saveModel : function(Model) {
	saveModel(Model);
}

}; // end exports

// TODO do the Cypher query with object constructed from ModelElement
function resolveId(ModelElement)  {
	var queryPart="";
	for(i in ModelElement.conformsTo().__attributes) {
		//ModelElement[i] = attribute content, i = attribute name.
		if(queryPart==="") {
		queryPart+='n.'+i+'='+'\"'+ModelElement[i]+'\"'
		} else {
		queryPart+='and n.'+i+'='+'\"'+ModelElement[i]+'\"'
		}
	}
	db.cypherQuery('MATCH (n) WHERE '+queryPart+' RETURN n', null, function (err, result) {	
			console.log('MATCH (n) WHERE '+queryPart+' RETURN n');
			//for(i in result.data) {
			//	console.log(result.data[i]._id);
			//}
		if(result.data.length!=0) {
			if(result.data.length==1) {
				return result.data[0]._id;
			} else {
				console.log("many results, returning last value");
				var last = result.data.length-1;
				return result.data[last]._id;
			}
		} else { console.log("merde"); }
	});
}


function resolveIdFromModelElement(ModelElement) {
var labelMetaClass = ModelElement.conformsTo().__name;
var pushObject = {};
        
for(i in ModelElement.conformsTo().__attributes) {
    pushObject[i] = ModelElement[i];
}
    
 db.readNodesWithLabelsAndProperties (labelMetaClass, pushObject, function(err, result) {
    if(err) {
        throw err   
    } else {
        return(result[0]._id);
        
    }
 });
}


function queryGeneration(ModelElement)  {
	var queryPart="";
	for(i in ModelElement.conformsTo().__attributes) {
		//ModelElement[i] = attribute content, i = attribute name.
		if(queryPart==="") {
		queryPart+='n.'+i+'='+'\"'+ModelElement[i]+'\"';
		} else {
		queryPart+=' and n.'+i+'='+'\"'+ModelElement[i]+'\"';
		}
	}
	return queryPart;
}

function deleteAllNodes(ModelElement) {

	var query = queryGeneration(ModelElement);
	db.cypherQuery('MATCH (n) WHERE '+query+' RETURN n', null, function (err, result) {	
		for(i in result.data) {
			idTarget = result.data[i]._id;
			db.deleteNode(idTarget, function (err, node) {
				if(err) {
					throw err;
				}
				console.log(node);
			});
		}
		
	});
}
//DeleteNodeWithLabelAndProperties = avoid to resolve IDS check!!!

function saveModel(Model) {
	//building element list

	modelElements = [];
	for(meta in Model.modellingElements) {
		for(j in Model.modellingElements[meta]) {
			modelElements.push(Model.modellingElements[meta][j]);
		}
	}  
     //inspect(modelElements);
	//create node before references, using async lib
	async.eachSeries(modelElements, function(element, callback) {	
		var pushObject = {};
        
        for(i in element.conformsTo().__attributes) {
			 pushObject[i] = element[i];
		  }
        
        var labelMetaClass = element.conformsTo().__name;
        var labelModelName = element.conformsTo().__name;
        
        //WARNING We are in presence of undefined metaelement OR a metaclass
        if(labelMetaClass==undefined) {      
            labelMetaClass = Model.__name+"_Class_Undefined";
        }
       
		db.insertNode(pushObject , 
			[labelMetaClass,labelModelName],
			function(err, result) {
				if(err) {
					throw err;
				} else {
					idSource = result._id;
					console.log('Object of Type: '+labelMetaClass+' Added');
					callback();
				}
		});	
	}, function (res) {
		console.log("All nodes pushed into Neo4J... pushing associations");       
		async.eachSeries(modelElements, function(element, callback5) {
			//console.dir("Elements: "+element);
			//createReferencesBVERSION(element,callback5);
            createReferencesCVERSION(element,callback5);
		}, function(res2) {
			console.log("Model pushed fully into Neo4J");
		});
	});
}


function createMetaNode(MetaModelElement, Model,callback) {
	var pushObject = {};
	pushObject["__name"] = MetaModelElement.__name;
    var metalabel = Model.__name+"_"+MetaModelElement.__name;
	//Insert a node conforms to the model schema
	for(i in MetaModelElement.__attributes) {
		console.log(MetaModelElement.__attributes[i]);
		pushObject[i] = MetaModelElement.__attributes[i];
	}
	db.insertNode(pushObject , 
			metalabel,
			function(err, result) {
			if(err) {
				throw err;
			} else {
				idSource = result._id;
				console.log('MetaObject of Type: '+metalabel+' Added');
                callback();
			}
	});	
}

//REFERENCE Using "build String Queries"
function createReferencesBVERSION(ModelElement, callback5) {
	var querySource="";
	var queryTarget="";
	var queryTargetType="";
	var idSource;
	var idTarget;
	var idTargets = [];
	var labeledIds = {};
	var relationLabel;
	var currentRelationElement;
	
	querySource = queryGeneration(ModelElement);
	querysourceType = "`"+ModelElement.conformsTo().__name+"`";
	var targetElements=[];

	for(i in ModelElement.conformsTo().__references) {
			currentRelationElement = ModelElement[i];
			relationLabel = i;
			for(relIt in currentRelationElement) {
				//console.log(i, currentRelationElement[relIt]); 
				targetElements.push({label: relationLabel, el :currentRelationElement[relIt]});
			}
	}
	
	//inspect(targetElements);
	
	//if referenceElement is not empty
	async.parallelLimit( 
	[ function(callback1) {
		// Get Source ID if references...
//debug 
        //console.log('SOURCE! MATCH (n:'+querysourceType+') WHERE '+querySource+' RETURN n');
		db.cypherQuery('MATCH (n:'+querysourceType+') WHERE '+querySource+' RETURN n', null, function (err, result) {	
			if(result.data.lenght!=0) {
				//Always return the first value (oldest node)
				idSource = result.data[0]._id;		
			} else {console.log("Error object not found in Database")};	
			callback1();
		});
	},	function(callback3) {
				async.eachSeries(targetElements, function(element,callback2) {
				//console.log(element);
					queryTarget = queryGeneration(element.el);
					queryTargetType = "`"+element.el.conformsTo().__name+"`";
//debug //console.log(' TARGET! MATCH (n:'+queryTargetType+') WHERE '+queryTarget+' RETURN n');
					db.cypherQuery('MATCH (n:'+queryTargetType+') WHERE '+queryTarget+' RETURN n', null, function (err, result) {	
						if(result.data.length!=0) {
							idTargets.push({label: element.label, el:result.data[0]._id});
							idTarget = result.data[0]._id;
						} else {console.log("Error object not found in Database");}
							callback2();
						});
					}, function(err) {
						if(err)  {
							console.log(err);
						}
						callback3();
					});
	}], 
        10, //up to 10 queries in parallel (WARNING arbitrary limit).
        function(err) {
		//console.log(idTargets);	
		async.eachSeries(idTargets, function(relation, callback6) {
//DEbug //console.log("insertion! "+ idSource+"->"+relation.el+" with label "+ relation.label);
			 db.insertRelationship(idSource,relation.el, relation.label,{}, function(err, result){ // let see if transition should support some properties... 
				if(err) {
					throw err;
				} else {
					relationid = result._id;
					console.log("Reference created "+relation.label);
					callback6();
				}
			});// end dbInsert 
		}, function(err) {
			//callback5(); //all relation are supposed to be pushed into DB
		});	
		callback5();
	}); //end parallel
}


//Version Using WebService Query
function createReferencesCVERSION(ModelElement, callback5) {
	var querySource="";
	var queryTarget="";
	var queryTargetType="";
	var idSource;
	var idTarget;
	var idTargets = [];
	var labeledIds = {};
	var relationLabel;
	var currentRelationElement;
	
	var targetElements=[];

    var labelMetaClass = ModelElement.conformsTo().__name;
    var pushObject = {};
        
    for(i in ModelElement.conformsTo().__attributes) {
        pushObject[i] = ModelElement[i];
    }
    
	for(i in ModelElement.conformsTo().__references) {
			currentRelationElement = ModelElement[i];
			relationLabel = i;
			for(relIt in currentRelationElement) {
				//console.log(i, currentRelationElement[relIt]); 
				targetElements.push({label: relationLabel, el :currentRelationElement[relIt]});
			}
	}
	
	//inspect(targetElements);
	
	//if referenceElement is not empty
	async.parallelLimit( 
	[ function(callback1) {
		// Get Source ID if references...
//debug 
        //console.log('SOURCE! MATCH (n:'+querysourceType+') WHERE '+querySource+' RETURN n');
		db.readNodesWithLabelsAndProperties (labelMetaClass, pushObject, function (err, result) {	
			if(result.lenght!=0) {
				//Always return the first value (oldest node)
				idSource = result[0]._id;		
			} else { console.log("Error object not found in Database")};	
			callback1();
		});
	},	function(callback3) {
				async.eachSeries(targetElements, function(element,callback2) {
				    var pushObject = {};
                    var labelMetaClass = element.el.conformsTo().__name;
					for(j in element.el.conformsTo().__attributes) {
                        pushObject[j] = element.el[j];
                    }
					
//debug //console.log(' TARGET! MATCH (n:'+queryTargetType+') WHERE '+queryTarget+' RETURN n');
					db.readNodesWithLabelsAndProperties(labelMetaClass,pushObject, function (err, result) {	
						if(result.length!=0) {
							idTargets.push({label: element.label, el:result[0]._id});
							//idTarget = result[0]._id;
						} else {console.log("Error object not found in Database");}
							callback2();
						});
					}, function(err) {
						if(err)  {
							console.log(err);
						}
						callback3();
					});
	}], 
        10, //up to 10 queries in parallel (WARNING arbitrary limit).
        function(err) {
		//console.log(idTargets);	
		async.eachSeries(idTargets, function(relation, callback6) {
//DEbug //console.log("insertion! "+ idSource+"->"+relation.el+" with label "+ relation.label);
			 db.insertRelationship(idSource,relation.el, relation.label,{}, function(err, result){ // let see if transition should support some properties... 
				if(err) {
					throw err;
				} else {
					relationid = result._id;
					console.log("Reference created "+relation.label);
					callback6();
				}
			});// end dbInsert 
		}, function(err) {
			//callback5(); //all relation are supposed to be pushed into DB
		});		 
		callback5();
	}); //end parallel
}

/*
function createNode(ModelElement) {
	var pushObject = {};
	var pushRelation = {};
	var relationLabel;
	var idSource;
	//Insert a node conforms to the model schema
	for(i in ModelElement.conformsTo().__attributes) {
		pushObject[i] = ModelElement[i];
	}
	db.insertNode(pushObject , 
			ModelElement.conformsTo().__name,
			function(err, result) {
			if(err) {
				throw err;
			} else {
				idSource = result._id;
				//console.log(idSource);
				console.log('Object of Type: '+ModelElement.conformsTo().__name+' Added');
				//console.log(pushObject); //dump object
			}
	});	
	return idSource;
}
*/