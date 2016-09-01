var JSMF = require('../JSMF_Prototype'); var Model = JSMF.Model; var Class = JSMF.Class;
var MM = require('./MMFamily.js');
var inspect = require('eyes').inspector({
    maxLength: 9000
});
var hash = require('object-hash');

/***************************33
the example
****/
var ma = new Model('a');
var familyMarch = MM.Family.newInstance('march');
familyMarch.setlastName('March');

var fatherM = MM.Member.newInstance('Jim');
fatherM.setfirstName('Jim');
var motherM = MM.Member.newInstance('Cindy');
motherM.setfirstName('Cindy');
var sonM = MM.Member.newInstance('Brandon');
sonM.setfirstName('Brandon');
var daughterM = MM.Member.newInstance('Brenda');
daughterM.setfirstName('Brenda');

//familyMarch.setfather(fatherM);
fatherM.setfamilyFather(familyMarch);
//familyMarch.setmother(motherM);
motherM.setfamilyMother(familyMarch);
//familyMarch.setsons(sonM);
sonM.setfamilySon(familyMarch);
//familyMarch.setdaughters(daughterM);
daughterM.setfamilyDaughter(familyMarch);

var familySailor = MM.Family.newInstance('Sailor');
familySailor.setlastName('Sailor');

var FatherS = MM.Member.newInstance('Peter');
FatherS.setfirstName('Peter');

var MotherS = MM.Member.newInstance('Jackie');
MotherS.setfirstName('Jackie');

var SonS1 = MM.Member.newInstance('David');
SonS1.setfirstName('David');

var SonS2 = MM.Member.newInstance('Dylan');
SonS2.setfirstName('Dylan');

var DaughterS = MM.Member.newInstance('Kelly');
DaughterS.setfirstName('Kelly');

//familySailor.setfather(FatherS);
FatherS.setfamilyFather(familySailor); 
//familySailor.setmother(MotherS);
MotherS.setfamilyMother(familySailor);
//familySailor.setsons(SonS1);
SonS1.setfamilySon(familySailor);
//familySailor.setsons(SonS2);
SonS2.setfamilySon(familySailor);
//familySailor.setdaughters(DaughterS);
DaughterS.setfamilyDaughter(familySailor);

//ma.setReferenceModel(MM.mma);
ma.setModellingElements([familyMarch,fatherM,motherM,sonM,daughterM,familySailor,FatherS,MotherS,SonS1,SonS2,DaughterS]);


var hashTable = new hash.HashTable();

var SonS1Hash = hash(SonS1);
hashTable.add(SonS1,SonS2);

var sonref = hashTable.getValue(SonS1Hash);

inspect(sonref);
