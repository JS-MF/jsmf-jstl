var JSTL = require('../../index'); var Transformation= JSTL.Transformation;
var JSMF = require('jsmf-core'); var Model = JSMF.Model; var Class = JSMF.Class;

//Load the metamodels (in one file for the example)
var MM = require('./MMABExamples'); //var A = MM.A; //for defining quick access to metamodel elements

//Load the model (in one file for the example)
var M = require('./MABExamples');
var inspect = require('eyes').inspector({
    maxLength: 9000
});

// <=> to the underscore library.
var _ = require('lodash');


/*****************************************************************
* example transformation input model (ma) and output model (mb)
* ma:   A(name)  -> C(id)
*       ^        ^  ^
*       |        |  |
* mb:   B(nameB) -> D(num)
******************************************************************/


/* **********************
*    Rules Delcaration
**************************/

//Simple Rule Definition
var trule2 = {                                      //ATL <=> rule trule2 {

    in : function(inputModel) {                      //ATL <=> from inputModel : MM!C
        console.log(inputModel.Filter(MM.C));
        return inputModel.Filter(MM.C);
    },

    out : function(inp) {
        var d = MM.D.newInstance('transformed');    //ATL<~>d: MM!D (
        d.setNum(inp.id);                           // ATL <=> num <- inp.id
        return [d];
    }
}

//Rule with relations
var transformation1  = { //ATL <=> rule transformation1 {

    in : function(inputModel) { //ATL <=> from inputModel :
            return (                                //not present in ATL... embbed
                _.reject(inputModel.Filter(MM.A),   //ATL <=> MM!A(in->select
                    {name:'titi'})                  //                      (e | e.name!='titi')
            );
    },

    out : function(inp) {                           //ATL <=> to (withtout any ref to output elements)
            var b = MM.B.newInstance('');           // <=> o : MM!B //here we call newInstance explicitly.. should be hidden
            b.setNameB(inp.name+'_transfo');        //ATL <=> nameB <= inp.name+'transfo'
            this.assign(b, 'toD', inp.toC); // this should be b.toC=inp.toC
                                            // ATL <=> targetOutput <- i.targetInput
            return [b];        //to be hidden?.... order independent, possible mutilple outputmodel elements!
    }
}

/* *************************
*   Transformation Launcher
*****************************/
var module = new Transformation(); //multiple input/output models? -> not implemented yet
//Order independent
module.addRule(trule2);
module.addRule(transformation1);

//Apply rule by rule...
//module.apply(t);
//module.apply(trule2);

//Apply all rules in the models and resolve references, actual transformation execution
module.apply(M.ma, M.mb);

inspect(M.mb);
//(_(M.mb.Filter(MM.B)).first());
