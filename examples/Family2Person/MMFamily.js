var JSMF = require('jsmf-core'); var Model = JSMF.Model; var Class = JSMF.Class; var Enum = JSMF.Enum;

var mma = new Model('Famillies');

var Family = Class.newInstance('Family');
var Member = Class.newInstance('Member');

Family.setAttribute('lastName', String);
Family.setReference('father',Member,1,'familyFather',true);
Family.setReference('mother',Member,1,'familyMother', true);
Family.setReference('sons',Member,-1, 'familySon', true);
Family.setReference('daughters',Member,-1,'familyDaughter', true);

Member.setAttribute('firstName', String);
Member.setReference('familyFather',Family,1, 'father');
Member.setReference('familyMother', Family,1, 'mother');
Member.setReference('familySon', Family,1, 'sons');
Member.setReference('familyDaughter', Family,1, 'daughters');

//console.log(Family.__references['father']);

mma.setModellingElements([Family,Member]);


module.exports = {

    mma : mma,

  //  mmb : mmb,

    Family: Family,

    Member: Member

};
