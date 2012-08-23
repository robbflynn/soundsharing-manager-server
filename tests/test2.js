var sys = require('sys');
/*
var b1 = new Buffer("1234567890");
var b2 = b1.slice(0, 3);

sys.log(b1);
sys.log(b2);*/

/*var a1 = [1, "s", 3];
var a2 = [1, "s", 3];
var a3 = [1, "s", 4];

sys.log(a1 === a2);
sys.log(a1 === a3);*/

var flashsocket = require('flashsocket-js');

var oreg = new flashsocket.ObjectRegister();

oreg.register(["SHIT", "A1", "B1", "C1"], "ASD");
oreg.register(["SHIT", "A1", "B1", "C2"], "ASD");
oreg.register(["SHIT", "A2", "B2", "C3"], "ASD");
oreg.register(["SHIT", "A1", "B2", "C1", "F2"], "ASD");
oreg.register(["SHIT", "A3", "B1", "C3", "F3"], "ASD");
oreg.register(["SHIT", "A1", "B4", "C1", "F7", "F11"], "ASD");
oreg.register(["SHIT2", "A1", "B3", "C1"], "ASD");
oreg.register(["SHIT2", "A1", "B1", "C2"], "ASD");
oreg.register(["SHIT3", "A1", "B1", "C1"], "ASD");
oreg.register(["SHIT4", "A1", "B1", "C1"], "ASD");
//var map1 = oreg.buildMap2(["SHIT"]);
var map2 = oreg.buildMap(["SHIT", "A1"], 0);

sys.log("---------------------------- " + (map2));

/*for (var s in map1)
	sys.log(map1[s]);

sys.log("----------------------------");*/

for (var s in map2)
	sys.log(map2[s]);

sys.log("----------------------------");