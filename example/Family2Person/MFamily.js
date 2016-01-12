var JSMF = require('jsmf-core'); var Model = JSMF.Model; var Class = JSMF.Class;
var MM = require('./MMFamily');
var inspect = require('eyes').inspector({
    maxLength: 9000
});

var ma = new Model('a');
var familyMarch = MM.Family.newInstance('march');
familyMarch.setLastName('March');

var fatherM = MM.Member.newInstance('Jim');
fatherM.setFirstName('Jim');
var motherM = MM.Member.newInstance('Cindy');
motherM.setFirstName('Cindy');
var sonM = MM.Member.newInstance('Brandon');
sonM.setFirstName('Brandon');
var daughterM = MM.Member.newInstance('Brenda');
daughterM.setFirstName('Brenda');

//Should be resolved later with opposite!!!!!!!
//familyMarch.setFather(fatherM);
fatherM.setFamilyFather(familyMarch);
//familyMarch.setmother(motherM);
motherM.setFamilyMother(familyMarch);
//familyMarch.setsons(sonM);
sonM.setFamilySon(familyMarch);
//familyMarch.setdaughters(daughterM);
daughterM.setFamilyDaughter(familyMarch);

var familySailor = MM.Family.newInstance('Sailor');
familySailor.setLastName('Sailor');

var FatherS = MM.Member.newInstance('Peter');
FatherS.setFirstName('Peter');

var MotherS = MM.Member.newInstance('Jackie');
MotherS.setFirstName('Jackie');

var SonS1 = MM.Member.newInstance('David');
SonS1.setFirstName('David');

var SonS2 = MM.Member.newInstance('Dylan');
SonS2.setFirstName('Dylan');

var DaughterS = MM.Member.newInstance('Kelly');
DaughterS.setFirstName('Kelly');

//familySailor.setFather(FatherS);
FatherS.setFamilyFather(familySailor);
//familySailor.setmother(MotherS);
MotherS.setFamilyMother(familySailor);
//familySailor.setsons(SonS1);
SonS1.setFamilySon(familySailor);
//familySailor.setsons(SonS2);
SonS2.setFamilySon(familySailor);
//familySailor.setdaughters(DaughterS);
DaughterS.setFamilyDaughter(familySailor);

//ma.setReferenceModel(MM.mma);
ma.setModellingElements([familyMarch,fatherM,motherM,sonM,daughterM,familySailor,FatherS,MotherS,SonS1,SonS2,DaughterS]);

//ma.setModellingElements([familyMarch,familySailor]);

module.exports = {
    ma : ma
}
