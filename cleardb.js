var sys = require('sys');
var mongodm = require("mongodm");

mongodm.withDatabase("soundsharedb", function(err, dbfacade) {
	if (!err)
	{
		/*dbfacade.withCollection("accounts").remove({});
		dbfacade.withCollection("channels").remove({});
		dbfacade.withCollection("playlists").remove({});
		dbfacade.withCollection("groups").remove({});
		dbfacade.withCollection("stations").remove({});*/
		dbfacade.withCollection("notifications").remove({});
		dbfacade.withCollection("groups_members").remove({});
		dbfacade.withCollection("members").remove({});
		
		
		/*dbfacade.withCollection("shit").remove({_id: "test"}, function(err, doc) {  
			sys.log("[UPDATE]: " + err + ":" + doc);
		});*/
		
		
		sys.log("[MongoDB cleared]");
	}
	else
		sys.log("Error connecting MongoDB: " + err);
});