var JSMF = require('jsmf-core'); var Model = JSMF.Model; var Class = JSMF.Class; var Enum = JSMF.Enum;

var mmb = new Model('Person');

var Person = Class.newInstance('Person');
Person.setAttribute('fullName', String);

var Male = Class.newInstance('Male');
var Female = Class.newInstance('Female');

Male.setSuperType(Person);
Female.setSuperType(Person);


mmb.setModellingElements([Person,Male,Female]);

module.exports = {

    mmb : mmb,

    Person: Person,

    Male : Male,

    Female : Female


};
