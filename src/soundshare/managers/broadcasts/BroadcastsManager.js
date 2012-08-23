var fs = require('fs');
var sys = require('sys');

var flashsocket = require('flashsocket-js');

var ServerEventDispatcher = flashsocket.ServerEventDispatcher;
var ObjectRegister = flashsocket.ObjectRegister;

var Broadcaster = require('../../broadcasters/Broadcaster');
var StandardRadioBroadcast = require('../../broadcasts/StandardRadioBroadcast');

var StandardRadioBroadcastBuilder = require('../../builders/broadcasts/StandardRadioBroadcastBuilder');
var RemoteBroadcastsManagersBuilder = require('../../builders/managers/RemoteBroadcastsManagersBuilder');
var SecureServerActionMessageBuilder = require('../../builders/messages/actions/SecureServerActionMessageBuilder');

BroadcastsManager = module.exports = function(context)
{
	ServerEventDispatcher.call(this);
	
	this.setId("BROADCASTS_MANAGER");
	this.context = context;
	
	this.standardRadioBroadcastBuilder = new StandardRadioBroadcastBuilder(context, this);
	this.remoteBroadcastsManagersBuilder = new RemoteBroadcastsManagersBuilder(context, this);
	
	this.broadcasts = new ObjectRegister();
	
	var _self = this;
	
	this.addAction("CREATE_STANDARD_RADIO_BROADCAST", function(client, message) {
		_self.executeCreateStandardRadioBroadcast(client, message);
	});
	
	this.addAction("DESTROY_STANDARD_RADIO_BROADCAST", function(client, message) {
		_self.executeDestroyStandardRadioBroadcast(client, message);
	});
	
	
	this.addAction("CREATE_REMOTE_PLAYLIST_BROADCAST", function(client, message) {
		_self.executeCreateRemotePlaylistBroadcast(client, message);
	});
};

BroadcastsManager.prototype = new ServerEventDispatcher();

// ************************************************************************************************************************
// 										    CREATE STANDARD RADIO BROADCAST
// ************************************************************************************************************************

BroadcastsManager.prototype.createStandardRadioBroadcast = function(channelId, token)
{
	var broadcast = this.standardRadioBroadcastBuilder.build();
	broadcast.setId(channelId);
	
	this.broadcasts.register([token, channelId], broadcast);
	
	return broadcast;
};

BroadcastsManager.prototype.executeCreateStandardRadioBroadcast = function(client, message)
{
	var header = message.getJSONHeader();
	var body = message.getJSONBody();
	
	var sender = header.route.sender;
	
	var channelId = body ? body.channelId : null;
	
	sys.log("1.BroadcastsManager[executeCreateStandardRadioBroadcast]: " + channelId + " : " + sender);
	
	if (sender && channelId)
	{
		var _self = this;
		var broadcast = this.createStandardRadioBroadcast(channelId, client.data.accountContext.token);
		
		this.context.dbfacade.withCollection("channels").update({_id: channelId}, {$set: {"status": 1, "route": broadcast.route}}, function(err) {
			if (!err)
			{
				_self.dispatchSocketEvent({
					event: {
						type: "CREATE_STANDARD_RADIO_BROADCAST_COMPLETE", 
						data: {
							channelId: channelId,
							broadcasterRoute: broadcast.route
						}
					},
					receiver: sender
				});
				
				sys.log("2.BroadcastsManager[executeCreateStandardRadioBroadcast]: " + broadcast.id + " : " + broadcast.route);
			}
			else
			{
				sys.log("3.BroadcastsManager[executeCreateStandardRadioBroadcast]: Error!");
				
				_self.standardRadioBroadcastBuilder.destroy(broadcast);
				_self.broadcasts.unregister([channelId, client.data.accountContext.token]);
				
				_self.dispatchSocketEvent({
					event: {
						type: "CREATE_STANDARD_RADIO_BROADCAST_ERROR", 
						data: {
							code: 0, 
							error: "Error start broadcasting!"
						}
					},
					receiver: sender
				});
			}
		});
	}
	else
		sys.log("2.BroadcastsManager[executeCreateStandardRadioBroadcast]: Invalid message! ");
};

// ************************************************************************************************************************
// 											DESTROY STANDARD RADIO BROADCAST
// ************************************************************************************************************************

BroadcastsManager.prototype.executeDestroyStandardRadioBroadcast = function(client, message)
{
	var header = message.getJSONHeader();
	var body = message.getJSONBody();
	
	var sender = header.route.sender;
	
	var channelId = body ? body.channelId : null;
	
	sys.log("1.BroadcastsManager[executeDestroyStandardRadioBroadcast]: " + channelId + " : " + sender);
	
	if (sender && channelId)
	{
		var _self = this;
		
		this.destroyStandardRadioBroadcast(channelId, client.data.accountContext.token, function(err) {
			if (!err)
				_self.dispatchSocketEvent({
					event: {
						type: "DESTROY_STANDARD_RADIO_BROADCAST_COMPLETE", 
						data: {
							channelId: channelId
						}
					},
					receiver: sender
				});
			else
				_self.dispatchSocketEvent({
					event: {
						type: "DESTROY_STANDARD_RADIO_BROADCAST_ERROR", 
						data: {
							code: 0, 
							error: "Unable to destroy standard radio broadcast!"
						}
					},
					receiver: sender
				});
		});
	}
	else
		sys.log("BroadcastsManager[executeDestroyStandardRadioBroadcast]: Invalid message!");
};

BroadcastsManager.prototype.destroyStandardRadioBroadcast = function(channelId, token, resultFunction)
{
	var broadcast = this.broadcasts.read([channelId, token]);
	
	if (broadcast)
	{
		broadcast.stopBroadcast();
		
		this.standardRadioBroadcastBuilder.destroy(broadcast);
		this.broadcasts.unregister([token, channelId]);
	}
	
	this.context.dbfacade.withCollection("channels").update({_id: channelId}, {$set: {"status": 0, "route": null}}, resultFunction);
};

// ************************************************************************************************************************
// 											CREATE REMOTE PLAYLIST BROADCAST
// ************************************************************************************************************************

BroadcastsManager.prototype.executeCreateRemotePlaylistBroadcast = function(client, message)
{
	var header = message.getJSONHeader();
	var body = message.getJSONBody();
	
	var sender = header.route.sender;
	
	var playlistId = body.playlistId;
	var playlistName = body.playlistName;
	var listenerId = body.listenerId;
	var listenerName = body.listenerName;
	var targetId = body.targetId;
	var stationId = body.stationId;
	var listenerRoute = body.listenerRoute;
	
	sys.log("1.BroadcastsManager[executeCreateRemotePlaylistBroadcast]: " + sender + ":" + playlistId);
	
	if (sender && playlistId && listenerId && targetId)
	{
		var _self = this;
		
		var server = this.context.serversManager.getOnlineServer();
		
		if (!server)
		{
			var accountContext = this.context.accountsDataManager.getAccountById(targetId);
			var targetClient = accountContext ? accountContext.getConnectionByStationId(stationId) : null;
			
			if (targetClient)
			{
				var remoteBroadcastsManager = _self.remoteBroadcastsManagersBuilder.build();
				remoteBroadcastsManager.identify(targetClient.data.routingMap);
				
				sys.log("2.BroadcastsManager[executeCreateRemotePlaylistBroadcast]: " + remoteBroadcastsManager.receiverRoute);
				sys.log("3.BroadcastsManager[executeCreateRemotePlaylistBroadcast]: " + accountContext.token);
				
				var completeFn;
				var errorFn;
				var disconnectClientFn;
				var disconnectHostFn;
				var removeListenersFn;
				
				var clientOnline = true;
				
				completeFn = function(data, body) { 
					
					_self.createRemotePlaylistBroadcastComplete({
						token: accountContext.token,
						listenerRoute: sender,
						broadcasterId: data.broadcasterId, 
						broadcasterRoute: data.broadcasterRoute, 
						playlistData: playlistData, 
						remoteBroadcastsManager: remoteBroadcastsManager, 
						clientOnline: clientOnline,
						server: server
					});
					
					removeListenersFn();
				};
				
				errorFn = function() { 
					_self.createRemotePlaylistBroadcastError(sender, remoteBroadcastsManager);
					removeListenersFn();
				};
				
				limitErrorFn = function() { 
					_self.createRemotePlaylistBroadcastLimitError(sender, remoteBroadcastsManager);
					removeListenersFn();
				};
				
				removeListenersFn = function() {
					client.removeListener("disconnect", disconnectClientFn);
					targetClient.removeListener("disconnect", disconnectHostFn);
					
					remoteBroadcastsManager.removeSocketEventListener("CREATE_REMOTE_PLAYLIST_BROADCAST_COMPLETE", completeFn);
					remoteBroadcastsManager.removeSocketEventListener("CREATE_REMOTE_PLAYLIST_BROADCAST_ERROR", errorFn);
					remoteBroadcastsManager.removeSocketEventListener("CREATE_REMOTE_PLAYLIST_BROADCAST_LIMIT_ERROR", limitErrorFn);
				};
				
				disconnectClientFn = function() {
					clientOnline = false;
				};
				
				disconnectHostFn = function() {
					errorFn();
				};
				
				client.on("disconnect", disconnectClientFn);
				targetClient.on("disconnect", disconnectHostFn);
				
				remoteBroadcastsManager.addSocketEventListener("CREATE_REMOTE_PLAYLIST_BROADCAST_COMPLETE", completeFn);
				remoteBroadcastsManager.addSocketEventListener("CREATE_REMOTE_PLAYLIST_BROADCAST_ERROR", errorFn);
				remoteBroadcastsManager.addSocketEventListener("CREATE_REMOTE_PLAYLIST_BROADCAST_LIMIT_ERROR", limitErrorFn);
				remoteBroadcastsManager.createRemotePlaylistBroadcast(playlistId, playlistName, listenerId, listenerName, listenerRoute);
				
				/*this.context.playlistsDataManager.loadPlaylistFile(playlistId, 
					function(playlistData){
						
						
					},
					function() {
						_self.createRemotePlaylistBroadcastError(sender);
					}
				);*/
			}
			else
				this.createRemotePlaylistBroadcastError(sender);
		}
		else
			this.createRemotePlaylistBroadcastError(sender);
	}
	else
		sys.log("ERR.BroadcastsManager[executeCreateRemotePlaylistBroadcast]: Invalid message! ");
};

BroadcastsManager.prototype.createRemotePlaylistBroadcastComplete = function(params)
{
	sys.log("1.BroadcastsManager[createRemotePlaylistBroadcastComplete]: " + params.sender);
	
	this.remoteBroadcastsManagersBuilder.destroy(params.remoteBroadcastsManager);
	
	if (params.clientOnline)
	{
		this.dispatchSocketEvent({
			event: {
				type: "CREATE_REMOTE_PLAYLIST_BROADCAST_COMPLETE", 
				data: {
					broadcasterRoute: params.broadcasterRoute,
					token: params.token,
					server: params.server
				}
			},
			receiver: params.listenerRoute,
			eventBody: params.playlistData
		});
	}
	else
	{
		var message = this.actionMessageBuilder.build({
				xtype: "DESTROY",
				data: {
					broadcasterId: params.broadcasterId
				}
			}, 
			null, 
			params.token, 
			params.broadcasterRoute
		);
		
		this.send(message);
	}
};

BroadcastsManager.prototype.createRemotePlaylistBroadcastError = function(sender, remoteBroadcastsManager)
{
	sys.log("1.BroadcastsManager[createRemotePlaylistBroadcastError]: " + sender);
	
	if (remoteBroadcastsManager)
		this.remoteBroadcastsManagersBuilder.destroy(remoteBroadcastsManager);
	
	this.dispatchSocketEvent({
		event: {
			type: "CREATE_REMOTE_PLAYLIST_BROADCAST_ERROR"
		},
		receiver: sender
	});
};

BroadcastsManager.prototype.createRemotePlaylistBroadcastLimitError = function(sender, remoteBroadcastsManager)
{
	sys.log("1.BroadcastsManager[createRemotePlaylistBroadcastLimitError]: " + sender);
	
	if (remoteBroadcastsManager)
		this.remoteBroadcastsManagersBuilder.destroy(remoteBroadcastsManager);
	
	this.dispatchSocketEvent({
		event: {
			type: "CREATE_REMOTE_PLAYLIST_BROADCAST_LIMIT_ERROR"
		},
		receiver: sender
	});
};

// ************************************************************************************************************************
// 													     CLIENT DISCONNECT
// ************************************************************************************************************************

BroadcastsManager.prototype.disconnected = function(client)
{
	ServerEventDispatcher.prototype.disconnected.call(this, client);
	
	sys.log("1.BroadcastsManager[disconected]");
	
	if (client.data.accountContext)
	{
		var token = client.data.accountContext.token;
		var map = this.broadcasts.buildObjectsMap([token]);
		
		if (map && map.length > 0)
		{
			var broadcast;
			var channelId;
			
			for (var i = 0;i < map.length;i ++)
			{
				broadcast = map[i].obj;
				channelId = map[i].route[map[i].route.length - 1];
				
				switch (broadcast.xtype)
				{
					case "STANDARD_RADIO_BROADCAST":
						this.destroyStandardRadioBroadcast(channelId, token);
					break;
				}
				
				sys.log("2.BroadcastsManager[disconected]: " + broadcast.xtype + " : " + broadcast.id);
			}
		}
	}
};

// ************************************************************************************************************************
// 													    
// ************************************************************************************************************************