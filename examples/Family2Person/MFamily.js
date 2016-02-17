var JSMF = require('jsmf-core'); var Model = JSMF.Model; var Class = JSMF.Class;
var MM = require('./MMFamily');
var inspect = require('eyes').inspector({
    maxLength: 9000
});

var ma = new Model('a');
var familyMarch = MM.Family.newInstance();
familyMarch.lastName = 'March';

var fatherM = MM.Member.newInstance();
fatherM.firstName = 'Jim';
var motherM = MM.Member.newInstance();
motherM.firstName = 'Cindy';
var sonM = MM.Member.newInstance();
sonM.firstName = 'Brandon';
var daughterM = MM.Member.newInstance();
daughterM.firstName = 'Brenda';

fatherM.familyFather = familyMarch;
motherM.familyMother = familyMarch;
sonM.familySon = familyMarch;
daughterM.familyDaughter = familyMarch;

var familySailor = MM.Family.newInstance();
familySailor.lastName = 'Sailor';

var FatherS = MM.Member.newInstance();
FatherS.firstName = 'Peter';

var MotherS = MM.Member.newInstance();
MotherS.firstName = 'Jackie';

var SonS1 = MM.Member.newInstance();
SonS1.firstName = 'David';

var SonS2 = MM.Member.newInstance();
SonS2.firstName = 'Dylan';

var DaughterS = MM.Member.newInstance();
DaughterS.firstName = 'Kelly';

FatherS.familyFather = familySailor;
MotherS.familyMother = familySailor;
SonS1.familySon = familySailor;
SonS2.familySon = familySailor;
DaughterS.familyDaughter = familySailor;

ma.setModellingElements([familyMarch,fatherM,motherM,sonM,daughterM,familySailor,FatherS,MotherS,SonS1,SonS2,DaughterS]);

module.exports = {
    ma : ma
}
