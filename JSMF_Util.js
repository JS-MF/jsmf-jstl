var JSMF = require('./JSMF_Prototype'); var Model = JSMF.Model; var Class = JSMF.Class;
var _ = require('underscore');


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
function demote(MetaModel) {
    
    var result = new Model(MetaModel.__name+"_Demoted");
    
    var tabresolution = [];
    var resolve = {};
    
    var M3Class = new Class("M3Class");
    M3Class.setAttribute("_name",String);
    //first round -> building metaclass
    for(e in MetaModel.modellingElements) {
        for(j in MetaModel.modellingElements[e]) {
        var currentClass = MetaModel.modellingElements[e][j];
            for(i in currentClass.__attributes) {
                M3Class.setAttribute(i, String);
            }          
            for(i in currentClass.__references) {
                M3Class.setReference(i,M3Class,-1);
            }
        } 
    }
    
   //Second Round -> building instance 
    for(e in MetaModel.modellingElements) {
        for(j in MetaModel.modellingElements[e]) {
        var currentClass = MetaModel.modellingElements[e][j];
        var test = M3Class.newInstance("test");
        test.set_name(currentClass.__name);
            
            for(i in currentClass.__attributes) {
                var currenttype = currentClass.__attributes[i].toString().split(" ")[1].replace("()","");
                var method="set"+i;
                test[method](currenttype);
            }
        }
        result.setModellingElement(test);
        resolve = { 
                    source : currentClass,
                    target : test
                  };
        
        tabresolution.push(resolve);
        //console.log(resolve);
    }
    
    //Third Round -> building relation
     for(e in MetaModel.modellingElements) {
        for(j in MetaModel.modellingElements[e]) {
        var currentClass = MetaModel.modellingElements[e][j];
        for(i in currentClass.__references) {
               var target = currentClass.__references[i].type;
               
                //get sources and target of the reference from the resolve link element
               var newsourcerefClass = _.find(tabresolution, function(param) {return param.source == currentClass;});
               var newtargetrefClass = _.find(tabresolution, function(param) {return  param.source == target;});
                var param = {};
               if(newtargetrefClass==undefined) { param = M3Class; } else { param = newtargetrefClass.target;}
               var refsetter = "set"+i;
               newsourcerefClass.target[refsetter](param);
               //newsourcerefClass[refsetter](newtargetrefClass);
            }
        }
     }
    
    // end of process
    console.log(result);
    //result.save();
    return result;
}

module.exports = {
//Function Create Node From Model Element
demote: function (MetaModelElement) {
	demote(MetaModelElement);
},



}; // end exports