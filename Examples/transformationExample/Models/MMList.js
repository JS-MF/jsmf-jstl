var JSMF = require('../../JSMF_Prototype'); var Model = JSMF.Model; var Class = JSMF.Class;

var AbstractElement = Class.newInstance('AbstractElement');
AbstractElement.setAttribute('name',String);

var CommonElement = Class.newInstance('CommonElement');

var RootElement = Class.newInstance('RootElement');
RootElement.setReference('elements',CommonElement,-1,undefined,true);

RootElement.setSuperType(AbstractElement);
CommonElement.setSuperType(AbstractElement);

