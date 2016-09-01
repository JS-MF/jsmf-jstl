var JSMF = require('../../JSMF_Prototype'); var Model = JSMF.Model; var Class = JSMF.Class;
var MM = require('./MMFamily.js');

var ma = new Model('a');
var familyMarch = MM.Family.newInstance('march');
familyMarch.setlastName('March');
var fatherM = MM.Member.newInstance('Jim');
var motherM = MM.Member.newInstance('Cindy');
var sonM = MM.Member.newInstance('Brandon');
var daughterM = MM.Member.newInstance('Brenda');

familyMarch.setfather(fatherM);
familyMarch.setmother(MotherM);
familyMarch.setsons(sonM);
familyMarch.setdaughters(daughterM);

var familySailor = MM.Family.newInstance('Sailor');
familySailor.setlastName('Sailor');
var FatherS = MM.Member.newInstance('Peter');
var MotherS = MM.Member.newInstance('Jackie');
var SonS1 = MM.Member.newInstance('David');
var Sons2 = MM.Member.newInstance('Dylan');
var DaughterS = MM.Member.newInstance('Kelly');

familySailor.setfather(FatherS);
familySailor.setmother(MotherS);
familySailor.setsons([SonS1,SonS2]);
familySailor.setdaughters(DaughterS);