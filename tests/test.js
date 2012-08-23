var sys = require('sys');

var a = [];
a["SHIT1"] = "ssss1";
a["SHIT2"] = "ssss2";

for (var s in a)
	break;

sys.log(s);