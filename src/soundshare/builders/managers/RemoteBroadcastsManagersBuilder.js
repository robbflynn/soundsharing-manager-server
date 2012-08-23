var fs = require('fs');
var sys = require('sys');

var RemoteBroadcastsManager = require('../../managers/broadcasts/RemoteBroadcastsManager');

RemoteBroadcastsManagersBuilder = module.exports = function(context, broadcastsManager)
{
	this.context = context;
	this.broadcastsManager = broadcastsManager;
	
	this.cache = new Array();
	this.cacheEnabled = true;
};

RemoteBroadcastsManagersBuilder.prototype.build = function()
{
	var manager = null;

	if (this.cacheEnabled && this.cache.length > 0)
		manager = this.cache.shift();
	
	if (!manager)
		manager = new RemoteBroadcastsManager();
	
	manager.context = this.context;
	manager.receiverNamespace = "socket.managers.RemoteBroadcastsManager";
	
	this.broadcastsManager.addUnit(manager);
	
	return manager;
};

RemoteBroadcastsManagersBuilder.prototype.destroy = function(manager)
{
	this.broadcastsManager.removeUnit(manager.id);
	
	if (this.cacheEnabled)
		this.cache.push(manager);
};