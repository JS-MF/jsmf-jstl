var MM = require('./TaskModel'); var mmState = MM.mmState;


var a = MM.State.newInstance('a');
a.setname('A');

var b = MM.State.newInstance('b');

var t = MM.Transition.newInstance('t');
t.setname('transitionenable');
t.setsource(a);


