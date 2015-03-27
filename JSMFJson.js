var CircularJSON = require('circular-json');
var fs = require('fs');
//var inspect = require('eyes').inspector({maxLength: 10900});
var JSMF = require('./JSMF_Prototype');
Class = JSMF.Class;
Model = JSMF.Model;

function saveModel(model,path) {
    
    //prepare for M2 modelling elements
    //var pathTest = __dirname + '/' + 'testFile';
    var serializedResult = CircularJSON.stringify(model);
    //does not includes the attributes
    fs.writeFile(path, serializedResult, function(err) {
        if(err) {
            console.log('err');
            throw(err);
        }  else {
            console.log('Saved');
        }
    });
}

function readModel(path) {
    console.log(path);
    var raw = fs.readFileSync(path);
    console.log(raw);
    var unserializedResult = CircularJSON.parse(raw);
 return unserializedResult;
}

module.exports = {
    
    saveModel: function(model,path) {
        return saveModel(model,path);   
    },
    
    readModel: function(path) {
        return readModel(path);
    }

};
