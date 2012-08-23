var sys = require('sys');

var SecureMongoDBManager = require('../../db/SecureMongoDBManager');

StationsDataManager = module.exports = function(context)
{
	SecureMongoDBManager.call(this, context, "stations");
	
	this.init();
	this.context = context;
	
	this.insetActionName = "STATION_INSERTED";
	this.updateActionName = "STATION_UPDATED";
	this.deleteActionName = "STATION_DELETED";
};

StationsDataManager.prototype = new SecureMongoDBManager();
StationsDataManager.prototype.executeDelete = function(req, res)
{
	var _self = this;
	var sessionId = req.param("sessionId");
	
	sys.log("1.-StationsDataManager[executeDelete]- " + sessionId);
	
	var expression = typeof req.body == "object" ? req.body : {};
	
	this.dbfacade.withCollection(this.collection).remove(expression, function(err, success) {
		if (!err && success)
		{
			res.send({data: expression});
			
			if (expression._id && sessionId)
			{
				_self.dbfacade.withCollection("channels").remove({stationId: expression._id});
				_self.dbfacade.withCollection("playlists").remove({stationId: expression._id});
				
				_self.context.accountsManager.sendRemoteActionBySessionId(sessionId, _self.deleteActionName, expression);
			}
		}
		else
			res.send({
				error: "Error", 
				code: 0
			});
	});
	
	
	/*MongoDBManager.prototype.executeDelete.call(this, req, res, function(err, obj) {
		if (!err && _self.deleteActionName)
			_self.context.accountsManager.sendRemoteActionBySessionId(sessionId, _self.deleteActionName, obj);
	});*/
};