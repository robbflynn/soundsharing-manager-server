var sys = require('sys');

var SecureMongoDBManager = require('../../db/SecureMongoDBManager');

NotificationsDataManager = module.exports = function(context)
{
	SecureMongoDBManager.call(this, context, "notifications");
	
	var _self = this;
	
	this.defineMethod('/jointogroup/:sessionId', function(req, res){
	    _self.executeInsertJoinToGroupRequest(req, res);
	});
};

NotificationsDataManager.prototype = new SecureMongoDBManager();
NotificationsDataManager.prototype.executeInsertJoinToGroupRequest = function(req, res)
{
	var _self = this;
	
	var sessionId = req.param("sessionId");
	var obj = req.body;
	obj._id = Math.uuidCompact();
	
	sys.log("1.-GroupsDataManager[executeInsertJoinToGroupRequest]- " + sessionId + "\n" + sys.inspect(obj));
	
	this.context.dbfacade.withCollection("notifications").insert(obj, function(err, doc) {
		
		sys.log("2.-GroupsDataManager[executeInsertJoinToGroupRequest]- " + err);
		
		if (!err)
		{
			var client = _self.context.socket.server.getClientBySessionId(sessionId);
			
			if (client)
				_self.context.accountsManager.newNotificationMessage(client, doc[0]);
			
			res.send({data: doc[0]});
		}
		else
			res.send({error: "Error", code: 0});
	});
};