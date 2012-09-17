var sys = require('sys');

var SecureMongoDBManager = require('../../db/SecureMongoDBManager');

ChannelsDataManager = module.exports = function(context)
{
	SecureMongoDBManager.call(this, context, "channels");
	
	this.init();
	
	this.insetActionName = "CHANNEL_INSERTED";
	this.updateActionName = "CHANNEL_UPDATED";
	this.deleteActionName = "CHANNEL_DELETED";
};

ChannelsDataManager.prototype = new SecureMongoDBManager();
ChannelsDataManager.prototype.executeUpdate = function(req, res, result)
{
	var _self = this;
	
	sys.log("1.-ChannelsDataManager[executeUpdate]- ");
	
	SecureMongoDBManager.prototype.executeUpdate.call(this, req, res, function(err, obj) {
		if (!err && obj)
		{
			var reqData = req.body;
			
			if (reqData.hasOwnProperty("active"))
			{
				var id = req.param("id");
				
				if (reqData.active)
					_self.context.channelsManager.watchChannelActivation(id, obj);
				else
					_self.context.channelsManager.watchChannelDeactivation(id, obj);
			}
		}
	});
};

ChannelsDataManager.prototype.deactivateAllChannels = function(stationId, accountId)
{
	var _self = this;
	
	sys.log("1.-ChannelsDataManager[deactivateAllChannels]- " + stationId + " : " + accountId);
	
	this.dbfacade.withCollection(this.collection).find({stationId: stationId, active: true}, function(err, collection) {
		if (!err && collection)
		{
			sys.log("2.-ChannelsDataManager[deactivateAllChannels]- " + collection.length);
			
			for (var s in collection)
				_self.dbfacade.withCollection(_self.collection).update({_id: collection[s]._id}, {$set: {active: false}}, function(err, success) {
					
					sys.log("3.-ChannelsDataManager[deactivateAllChannels]- " + err +":"+ success);
					
					if (!err && success)
					{
						collection[s].active = false;
						
						_self.context.channelsManager.watchChannelDeactivation(collection[s]._id, collection[s]);
						_self.context.accountsManager.sendRemoteActionByAccountId(accountId, _self.updateActionName, collection[s]);
					}
				});
		}
	});
};