var sys = require('sys');
var flashsocket = require('flashsocket');

var ServerEventDispatcher = flashsocket.ServerEventDispatcher;
var ObjectRegister = flashsocket.ObjectRegister;

var ServerContext = require('../../data/server/ServerContext');

ServersManager = module.exports = function(context)
{
	ServerEventDispatcher.call(this);
	
	this.setId("SERVERS_MANAGER");
	this.context = context;
	
	this.serversById = new Array();
	this.serversBySesstionId = new Array();
	this.serversByToken = new Array();
	
	this.watchers = new ObjectRegister();
	this.serversToWatch = new ObjectRegister();
	
	var _self = this;
	
	this.addAction("SERVER_UP", function(client, message) {
		_self.serverUp(client, message);
	});
	
	this.addAction("SERVER_DOWN", function(client, message) {
		_self.serverDown(client, message);
	});
	
	this.addAction("START_WATCH", function(client, message) {
		_self.executeStartWatchServer(client, message);
	});
	
	this.addAction("STOP_WATCH", function(client, message) {
		_self.executeStopWatchServer(client, message);
	});
	
	this.addAction("SHUT_DOWN_SERVER", function(client, message) {
		_self.shutDownServer(client, message);
	});
	
	this.addAction("GET_AVAILABLE_SERVER", function(client, message) {
		_self.executeGetAvailableServer(client, message);
	});
};

ServersManager.prototype = new ServerEventDispatcher();
ServersManager.prototype.validate = function(client, message)
{
	var header = message.getJSONHeader();
	var token = header.data ? header.data.token : null;
	
	return token && this.serversByToken[token];
};


ServersManager.prototype.registerContext = function(serverContext)
{
	this.serversById[serverContext._id] = serverContext;
	this.serversByToken[serverContext.token] = serverContext;
	
	var _self = this;
	
	serverContext.on("connectionTimeout", function() {
		
		delete(_self.serversById[serverContext._id]);
		delete(_self.serversByToken[serverContext.token]);
		
		sys.log("-ServersManager[connectionTimeout]- " + serverContext._id + " : " + serverContext.token + " : " + _self.serversById[serverContext._id] + " : " + _self.serversByToken[serverContext.token]);
	});
};

ServersManager.prototype.unregisterContext = function(serverContext)
{
	delete(this.serversById[serverContext._id]);
	delete(this.serversByToken[serverContext.token]);
	
	var client = serverContext.client;
	
	if (client)
	{
		delete(this.serversBySesstionId[client.sessionId]);
		
		serverContext.client = null;
		client.data.serverContext = null;
	}
};

ServersManager.prototype.executeGetAvailableServer = function(client, message)
{
	var header = message.getJSONHeader();
	var sender = header.route.sender;
	
	var body = message.getJSONBody();
	var plugins = body.plugins;
	
	var server = this.getOnlineServer(plugins);
	
	if (sender)
	{
		if (server)
			this.dispatchSocketEvent({
				event: {
					type: "GET_AVAILABLE_SERVER_COMPLETE",
					data: {
						_id: server._id,
						token: server.token,
						address: server.address,
						port: server.port
					}
				}, 
				receiver: sender
			});
		else
			this.dispatchSocketEvent({
				event: {
					type: "GET_AVAILABLE_SERVER_ERROR",
					data: {
						error: "There are no available broadcast server at this moment.\nPlease try again later!",
						code: 200
					}
				}, 
				receiver: sender
			});
	}
};

ServersManager.prototype.serverUp = function(client, message)
{
	var header = message.getJSONHeader();
	var body = message.getJSONBody();
	
	var sender = header.route.sender;
	
	var token = body ? body.token : null;
	var plugins = body ? body.plugins : null;
	
	sys.log("1.ServersManager[serverUp]: " + token);
	
	if (sender)
	{
		if (token)
		{
			var serverContext = this.serversByToken[token];
			
			if (serverContext)
			{
				if (!serverContext.client)
				{
					serverContext.client = client;
					serverContext.plugins = plugins;
					serverContext.connected();
					
					client.data.serverContext = serverContext;
					
					this.serversBySesstionId[client.sessionId] = serverContext;
					
					this.dispatchSocketEvent({
						event: {
							type: "SERVER_UP_COMPLETE"
						}, 
						receiver: sender
					});
					
					this.watchServerUp(serverContext._id);
				}
				else
					this.dispatchSocketEvent({
						event: {
							type: "SERVER_UP_ERROR",
							data: {
								error: "Server is already up!",
								code: 200
							}
						}, 
						receiver: sender
					});
			}
			else
				this.dispatchSocketEvent({
					event: {
						type: "SERVER_UP_ERROR",
						data: {
							error: "Server session is expired!",
							code: 200
						}
					}, 
					receiver: sender
				});
				
		}
		else
			this.dispatchSocketEvent({
				event: {
					type: "SERVER_UP_ERROR",
					data: {
						error: "Invalid server token!",
						code: 201
					}
				}, 
				receiver: sender
			});
	}
};

/*ServersManager.prototype.serverDown = function(client, message)
{
	var header = message.getJSONHeader();
	var body = message.getJSONBody();
	
	var sender = header.route.sender;
	
	var serverId = body ? body.serverId : null;
	
	sys.log("ServersManager[serverUp]: " + serverId);
	
	if (sender)
	{
		if (serverId)
		{
			if (this.serversById[serverId])
			{
				delete(this.serversById[serverId]);
				delete(this.serversBySesstionId[client.sessionId]);
				
				this.dispatchSocketEvent({
					event: {
						type: "SERVER_DOWN_COMPLETE"
					}, 
					receiver: sender
				});
				
				this.watchServerDown(serverId);
			}
			else
				this.dispatchSocketEvent({
					event: {
						type: "SERVER_DOWN_ERROR",
						data: {
							error: "Server is already down!",
							code: 200
						}
					}, 
					receiver: sender
				});
		}
		else
			this.dispatchSocketEvent({
				event: {
					type: "SERVER_DOWN_ERROR",
					data: {
						error: "Invalid server!",
						code: 201
					}
				}, 
				receiver: sender
			});
	}
};

ServersManager.prototype.shutDownServer = function(client, message)
{
	var header = message.getJSONHeader();
	var body = message.getJSONBody();
	
	var sender = header.route.sender;
	var serverId = body ? body.serverId : null;
	
	sys.log("ServersManager[shutDownServer]: " + serverId);
	
	if (sender)
	{
		if (serverId)
		{
			var clientContext = client.data.accountContext.getClientConextByServerId(serverId);
			
			if (clientContext)
			{
				this.context.accountsManager.sendRemoteActionBySessionIdToClient(clientContext, "SHUT_DOWN_SERVER");
				this.dispatchSocketEvent({
					event: {
						type: "SHIT_DOWN_SERVER_COMPLETE", 
						data: {
							serverId: serverId
						}
					}, 
					receiver: sender
				});
			}
			else
				this.dispatchSocketEvent({
					event: {
						type: "SHIT_DOWN_SERVER_ERROR", 
						data: {
							error: "Invalid server!",
							code: 202
						}
					}, 
					receiver: sender
				});
		}
		else
			this.dispatchSocketEvent({
				event: {
					type: "SHIT_DOWN_SERVER_ERROR", 
					data: {
						error: "Invalid server data!",
						code: 203
					}
				}, 
				receiver: sender
			});
	}
};*/

//************************************************************************************************************************
// 													WATCH UP
//************************************************************************************************************************

ServersManager.prototype.watchServerUp = function(serverId)
{
	var serverMap = this.serversToWatch.buildObjectsMap([serverId], [serverId]);
	var receivers = new Array();
	
	if (serverMap && serverMap.length > 0)
		for (var i = 0;i < serverMap.length;i ++)
			for (var k = 0;k < serverMap[i].obj.length;k ++)
				if (serverMap[i].obj[k].down)
					receivers.push(serverMap[i].route);
	
	sys.log("ServersManager[watchServerUp]: " + receivers);
	
	if (receivers.length > 0)
	{
		this.dispatchSocketEvent({
			event: {
				type: "SERVER_UP_DETECTED", 
				data: {
					serverId: serverId
				}
			}, 
			receivers: receivers
		});
	}
};

// ************************************************************************************************************************
// 													    WATCH DOWN
// ************************************************************************************************************************

ServersManager.prototype.watchServerDown = function(serverId)
{
	var serverMap = this.serversToWatch.buildObjectsMap([serverId], [serverId]);
	var receivers = new Array();
	
	if (serverMap && serverMap.length > 0)
		for (var i = 0;i < serverMap.length;i ++)
			for (var k = 0;k < serverMap[i].obj.length;k ++)
				if (serverMap[i].obj[k].down)
					receivers.push(serverMap[i].route);
	
	sys.log("1.ServersManager[watchServerDown]: " + receivers);
	
	if (receivers.length > 0)
	{
		this.dispatchSocketEvent({
			event: {
				type: "SERVER_DOWN_DETECTED", 
				data: {
					serverId: serverId
				}
			}, 
			receivers: receivers
		});
	}
};

// ************************************************************************************************************************
// 													    START WATCH
// ************************************************************************************************************************

ServersManager.prototype.executeStartWatchServer = function(client, message)
{
	var header = message.getJSONHeader();
	var body = message.getJSONBody();
	
	var sender = header.route.sender;
	
	var watchUp = body.up ? body.up : true;
	var watchDown = body.down ? body.down : true;
	var servers = body.servers;
	
	sys.log("1.ServersManager[executeStartWatchServer]: " + servers);
	
	if (sender)
	{
		if (servers)
		{
			this.startWatchServer(sender, servers, watchUp, watchDown, true);
			
			var serversReport = new Object();
			
			for (var s in servers)
				serversReport[servers[s]] = this.serversById[servers[s]] ? true : false;
				
			this.dispatchSocketEvent({
				event: {
					type: "START_WATCH_COMPLETE",
					data: {
						serversReport: serversReport
					}
				}, 
				receiver: sender
			});
		}
		else
			this.dispatchSocketEvent({
				event: {
					type: "START_WATCH_ERROR"
				}, 
				receiver: sender
			});
	}
};

ServersManager.prototype.startWatchServer = function(watcherRoute, servers, watchUp, watchDown)
{
	sys.log("ServersManager[startWatchServer]:" + watcherRoute +" : "+ servers +" : "+ watchUp +" : "+ watchDown);
	
	var serverId;
	var listener;
	
	for (var s in servers)
	{
		serverId = servers[s];
		
		listener = {
			up: watchUp, 
			down: watchDown
		};
		
		var path1 = watcherRoute.concat([serverId]);
		var path2 = [serverId].concat(watcherRoute);
		
		var watchers1 = this.watchers.read(path1);
		var watchers2 = this.serversToWatch.read(path2);
		
		if (!watchers1)
		{
			watchers1 = new Array();
			this.watchers.register(path1, watchers1);
		}
			
		watchers1.push(listener);
		
		if (!watchers2)
		{
			watchers2 = new Array();
			this.serversToWatch.register(path2, watchers2);
		}
			
		watchers2.push(listener);
	}
};

// ************************************************************************************************************************
// 													    STOP WATCH
// ************************************************************************************************************************

ServersManager.prototype.executeStopWatchServer = function(client, message)
{
	sys.log("ServersManager[executeStopWatchServer]:");
	
	var header = message.getJSONHeader();
	var body = message.getJSONBody();
	
	var sender = header.route.sender;
	
	var watchUp = body.up ? body.up : true;
	var watchDown = body.down ? body.down : true;
	var servers = body.servers;
		
	if (sender)
	{
		if (servers)
		{
			this.stopWatchServer(sender, servers, watchUp, watchDown);
			
			this.dispatchSocketEvent({
				event: {
					type: "STOP_WATCH_COMPLETE"
				}, 
				receiver: sender
			});
		}
		else
			this.dispatchSocketEvent({
				event: {
					type: "STOP_WATCH_ERROR"
				}, 
				receiver: sender
			});
	}
};

ServersManager.prototype.stopWatchServer = function(watcherRoute, servers, watchUp, watchDown)
{
	sys.log("ServersManager[stopWatchServer]:" + watcherRoute +" : "+ servers +" : "+ watchUp +" : "+ watchDown);
		
	var serverId;
	
	for (var s in servers)
	{
		serverId = servers[s];
		
		var path1 = watcherRoute.concat([serverId]);
		var path2 = [serverId].concat(watcherRoute);
		
		var watchers1 = this.watchers.read(path1);
		var watchers2 = this.serversToWatch.read(path2);
		
		var item;
		
		if (watchers1)
		{
			for (var i = 0;i < watchers1.length;i ++)
			{
				item = watchers1[i];
				
				if (item.up == watchUp && item.down == watchDown)
				{
					watchers1.splice(i, 1);
					
					sys.log("2.ServersManager[stopWatchServer][REMOVE]: " + i + " : " + watchers1.length);
					
					break;
				}
			}
			
			if (watchers1.length == 0)
				this.watchers.unregister(path1);
		}
		
		if (watchers2)
		{
			for (var i = 0;i < watchers2.length;i ++)
			{
				item = watchers2[i];
				
				if (item.up == watchUp && item.down == watchDown)
				{
					watchers2.splice(i, 1);
					
					sys.log("3.ServersManager[stopWatchServer][REMOVE]: " + i + " : " + watchers2.length);
					
					break;
				}
			}
			
			if (watchers2.length == 0)
				this.serversToWatch.unregister(path2);
		}
	}
};

ServersManager.prototype.getOnlineServer = function(plugins)
{
	var serverData;
	var plugin1;
	var plugin2;
	var exist;
	
	sys.log("ServersManager[getOnlineServer]: " + sys.inspect(plugins));
	
	for (var s in this.serversBySesstionId)
	{
		serverData = this.serversBySesstionId[s];
		
		if (!plugins || plugins.length == 0)
			return this.serversBySesstionId[s];
		else
		if (plugins.length <= serverData.plugins.length)
		{
			exist = 0;
			
			for (var i = 0;i < plugins.length;i ++)
			{
				plugin1 = plugins[i];
				
				for (var k = 0;k < serverData.plugins.length;k ++)
				{
					plugin2 = serverData.plugins[k];
					
					sys.log("6.ServersManager[getOnlineServer]: " + plugin1._id +":"+ plugin2._id +":"+ plugin1.version +":"+ plugin2.version);
					
					if (plugin1._id == plugin2._id && plugin1.version == plugin2.version)
					{
						sys.log("7.ServersManager[getOnlineServer]: " + sys.inspect(plugin1));
						sys.log("8.ServersManager[getOnlineServer]: " + sys.inspect(plugin2));
						exist ++;
					}
						
				}
			}
			
			if (exist == plugins.length)
				return this.serversBySesstionId[s];
		}
	}
		
	return null;
};

ServersManager.prototype.getContextById = function(serverId)
{
	return this.serversById[serverId];
};

ServersManager.prototype.getContextByToken = function(token)
{
	return this.serversByToken[token];
};

ServersManager.prototype.disconnected = function(client)
{
	sys.log("1.ServersManager[disconnected]");
	
	ServerEventDispatcher.prototype.disconnected.call(this, client);
	
	this.watchers.remove(client.data.route);
	this.serversToWatch.removeByPattern(["*"].concat(client.data.route));
	
	var serverContext = client.data.serverContext;
	
	if (serverContext)
	{
		sys.log("2.ServersManager[disconnected]: " + serverContext._id);
		
		this.watchServerDown(serverContext._id);
		this.unregisterContext(serverContext);
	}
};