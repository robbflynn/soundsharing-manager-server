var fs = require('fs');
var sys = require('sys');

var FlashSocketMessage = require('flashsocket').FlashSocketMessage;

RemoteBroadcastsManagerMessageBuilder = module.exports = function(target)
{
	this.target = target;
};

RemoteBroadcastsManagerMessageBuilder.prototype.build = function(xtype)
{
	if (!xtype)
		throw new Error("Invalid xtype!");
	
	var message = new FlashSocketMessage();
	message.setJSONHeader({
		route: {
			sender: this.target.route,
			receiver: this.target.receiverRoute
		},
		data: {
			token: this.target.token,
			action: {
				xtype: xtype
			}
		}
	});
	
	return message;
};

RemoteBroadcastsManagerMessageBuilder.prototype.buildCreateRemotePlaylistBroadcastMessage = function(playlistId, playlistName, listenerId, listenerName, listenerRoute)
{
	var message = this.build("CREATE_REMOTE_PLAYLIST_BROADCAST");
	message.setJSONBody({
		playlistId: playlistId,
		playlistName: playlistName,
		listenerId: listenerId,
		listenerName: listenerName,
		listenerRoute: listenerRoute
	});
	
	return message;
};