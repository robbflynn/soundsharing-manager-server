var fs = require('fs');
var sys = require('sys');

var ServerEventDispatcher = require('flashsocket').ServerEventDispatcher;

var RemoteBroadcastsManagerMessageBuilder = require('../../builders/messages/broadcasts/RemoteBroadcastsManagerMessageBuilder');

RemoteBroadcastsManager = module.exports = function(context, token)
{
	ServerEventDispatcher.call(this);
	
	this.context = context;
	this.token = token;
	
	this.messageBuilder = new RemoteBroadcastsManagerMessageBuilder(this);
};

RemoteBroadcastsManager.prototype = new ServerEventDispatcher();
RemoteBroadcastsManager.prototype.createRemotePlaylistBroadcast = function(playlistId, playlistName, listenerId, listenerName, listenerRoute)
{
	sys.log("1.RemoteBroadcastsManager[createRemotePlaylistBroadcast]: ");
	
	var mesasge = this.messageBuilder.buildCreateRemotePlaylistBroadcastMessage(playlistId, playlistName, listenerId, listenerName, listenerRoute);
	this.send(mesasge);
};