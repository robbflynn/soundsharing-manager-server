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
ChannelsDataManager.prototype.clearBroadcasts = function(stationId, accountId)
{
	var _self = this;
	
	sys.log("1.-ChannelsDataManager[clearBroadcasts]- " + stationId + " : " + accountId);
	
	this.dbfacade.withCollection(this.collection).find({stationId: stationId, active: true}, function(err, collection) {
		if (!err && collection)
		{
			sys.log("2.-ChannelsDataManager[clearBroadcasts]- " + collection.length);
			
			for (var s in collection)
				_self.dbfacade.withCollection(_self.collection).update({_id: collection[s]._id}, {$set: {active: false}}, function(err, success) {
					
					sys.log("3.-ChannelsDataManager[clearBroadcasts]- " + err +":"+ success);
					
					if (!err && success)
					{
						collection[s].active = false;
						_self.context.accountsManager.sendRemoteActionByAccountId(accountId, _self.updateActionName, collection[s]);
					}
				});
				
		}
	});
};