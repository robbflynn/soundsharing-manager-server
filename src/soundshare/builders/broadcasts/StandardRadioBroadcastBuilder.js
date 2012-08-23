var sys = require('sys');

var StandardRadioBroadcast = require('../../broadcasts/StandardRadioBroadcast');

StandardRadioBroadcastBuilder = module.exports = function(context, broadcastsManager)
{
	this.context = context;
	this.broadcastsManager = broadcastsManager;
	
	this.cache = new Array();
	this.cacheEnabled = true;
};

StandardRadioBroadcastBuilder.prototype.build = function()
{
	var manager = null;

	if (this.cacheEnabled && this.cache.length > 0)
		manager = this.cache.shift();
	
	if (!manager)
		manager = new StandardRadioBroadcast();
	
	manager.context = this.context;
	this.broadcastsManager.addUnit(manager);
	
	return manager;
}

StandardRadioBroadcastBuilder.prototype.destroy = function(manager)
{
	this.broadcastsManager.removeUnit(manager.id);
	
	if (this.cacheEnabled)
		this.cache.push(manager);
}