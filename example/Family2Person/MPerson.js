var JSMF = require('jsmf'); var Model = JSMF.Model; var Class = JSMF.Class;
var MM = require('./MMFamily.js');

var ma = new Model('a');
var familyMarch = MM.Family.newInstance('march');
familyMarch.setLastName('March');
var fatherM = MM.Member.newInstance('Jim');
var motherM = MM.Member.newInstance('Cindy');
var sonM = MM.Member.newInstance('Brandon');
var daughterM = MM.Member.newInstance('Brenda');

familyMarch.setFather(fatherM);
familyMarch.setMother(MotherM);
familyMarch.setSons(sonM);
familyMarch.setDaughters(daughterM);

var familySailor = MM.Family.newInstance('Sailor');
familySailor.setLastName('Sailor');
var FatherS = MM.Member.newInstance('Peter');
var MotherS = MM.Member.newInstance('Jackie');
var SonS1 = MM.Member.newInstance('David');
var Sons2 = MM.Member.newInstance('Dylan');
var DaughterS = MM.Member.newInstance('Kelly');

familySailor.setFather(FatherS);
familySailor.setMother(MotherS);
familySailor.setSons([SonS1,SonS2]);
familySailor.setDaughters(DaughterS);
