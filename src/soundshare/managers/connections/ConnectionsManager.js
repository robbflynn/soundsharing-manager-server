var sys = require('sys');
var flashsocket = require('flashsocket-js');

var ServerEventDispatcher = flashsocket.ServerEventDispatcher;
var ConnectionContext = require('../../data/connection/ConnectionContext');

ConnectionsManager = module.exports = function(context)
{
	ServerEventDispatcher.call(this);
	
	this.setId("CONNECTIONS_MANAGER");
	this.context = context;
	
	var _self = this;
	
	this.addAction("REGISTER_CONNECTION", function(client, message) {
		_self.executeRegisterAccountConnection(client, message);
	});
};

ConnectionsManager.prototype = new ServerEventDispatcher();
ConnectionsManager.prototype.executeRegisterAccountConnection = function(client, message)
{
	var header = message.getJSONHeader();
	var body = message.getJSONBody();
	
	var sender = header.route.sender;
	
	var token = body && body.token ? body.token : null;
	var managers = body && body.managers ? body.managers : null;
	
	var accountContext = this.context.accountsDataManager.getAccountByTokenId(token);
	var connectionContext = new ConnectionContext();
	connectionContext.client = client;
	connectionContext.managers = managers;
	
	accountContext.registerConnection(connectionContext);
	
	client.data.accountContext = accountContext;
	client.connectionContext = connectionContext;
	
	sys.log("ConnectionsManager[executeRegisterAccountConnection]: " + token + ":" + accountContext);
};

//************************************************************************************************************************
//	WATCH LOGIN
//************************************************************************************************************************

ConnectionsManager.prototype.watchConnectionUp = function(stationId)
{
	var stationMap = this.stationsToWatch.buildObjectsMap([stationId], [stationId]);
	var receivers = new Array();
	
	if (stationMap && stationMap.length > 0)
		for (var i = 0;i < stationMap.length;i ++)
			for (var k = 0;k < stationMap[i].obj.length;k ++)
				if (stationMap[i].obj[k].down)
					receivers.push(stationMap[i].route);
	
	sys.log("ConnectionsManager[watchConnectionUp]: " + receivers);
	
	if (receivers.length > 0)
	{
		var connectionContext = this.stationsById[stationId];
		
		this.dispatchSocketEvent({
			event: {
				type: "STATION_UP_DETECTED", 
				data: {
					stationId: stationId,
					managers: connectionContext.managers
				}
			}, 
			receivers: receivers
		});
	}
};

//************************************************************************************************************************
// WATCH LOGOUT
//************************************************************************************************************************

ConnectionsManager.prototype.watchConnectionDown = function(stationId)
{
	var stationMap = this.stationsToWatch.buildObjectsMap([stationId], [stationId]);
	var receivers = new Array();
	
	if (stationMap && stationMap.length > 0)
		for (var i = 0;i < stationMap.length;i ++)
			for (var k = 0;k < stationMap[i].obj.length;k ++)
				if (stationMap[i].obj[k].down)
					receivers.push(stationMap[i].route);
	
	sys.log("1.ConnectionsManager[watchConnectionDown]: " + receivers);
	
	if (receivers.length > 0)
	{
		var connectionContext = this.stationsById[stationId];
		
		this.dispatchSocketEvent({
			event: {
				type: "STATION_DOWN_DETECTED", 
				data: {
					stationId: stationId,
					managers: connectionContext.managers
				}
			}, 
			receivers: receivers
		});
	}
};

//************************************************************************************************************************
// START WATCH
//************************************************************************************************************************

ConnectionsManager.prototype.executeStartWatchConnections = function(client, message)
{
	var header = message.getJSONHeader();
	var body = message.getJSONBody();
	
	var sender = header.route.sender;
	
	var watchUp = body.up ? body.up : true;
	var watchDown = body.down ? body.down : true;
	var stations = body.stations;
	
	sys.log("1.ConnectionsManager[executeStartWatchConnections]: " + stations);
	
	if (sender)
	{
		if (stations)
		{
			this.startWatchConnection(sender, stations, watchUp, watchDown, true);
			
			var stationsReport = new Object();
			
			for (var s in stations)
				stationsReport[stations[s]] = this.stationsById[stations[s]] ? {
					managers: this.stationsById[stations[s]].managers
				} : false;
				
			this.dispatchSocketEvent({
				event: {
					type: "START_WATCH_COMPLETE",
					data: {
						stationsReport: stationsReport
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

ConnectionsManager.prototype.startWatchConnection = function(watcherRoute, stations, watchUp, watchDown)
{
	sys.log("ConnectionsManager[startWatchConnection]:" + watcherRoute +" : "+ stations +" : "+ watchUp +" : "+ watchDown);
	
	var stationId;
	var listener;
	
	for (var s in stations)
	{
		stationId = stations[s];
		
		listener = {
			up: watchUp, 
			down: watchDown
		};
		
		var path1 = watcherRoute.concat([stationId]);
		var path2 = [stationId].concat(watcherRoute);
		
		var watchers1 = this.watchers.read(path1);
		var watchers2 = this.stationsToWatch.read(path2);
		
		if (!watchers1)
		{
			watchers1 = new Array();
			this.watchers.register(path1, watchers1);
		}
			
		watchers1.push(listener);
		
		if (!watchers2)
		{
			watchers2 = new Array();
			this.stationsToWatch.register(path2, watchers2);
		}
			
		watchers2.push(listener);
	}
};

// ************************************************************************************************************************
// STOP WATCH
//************************************************************************************************************************

ConnectionsManager.prototype.executeStopWatchConnections = function(client, message)
{
	sys.log("ConnectionsManager[executeStopWatchConnections]:");
	
	var header = message.getJSONHeader();
	var body = message.getJSONBody();
	
	var sender = header.route.sender;
	
	var watchUp = body.up ? body.up : true;
	var watchDown = body.down ? body.down : true;
	var stations = body.stations;
		
	if (sender)
	{
		if (stations)
		{
			this.stopWatchConnection(sender, stations, watchUp, watchDown);
			
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

ConnectionsManager.prototype.stopWatchConnection = function(watcherRoute, stations, watchUp, watchDown)
{
	sys.log("ConnectionsManager[stopWatchConnection]:" + watcherRoute +" : "+ stations +" : "+ watchUp +" : "+ watchDown);
		
	var stationId;
	var stationContext;
	
	for (var s in stations)
	{
		stationId = stations[s];
		
		var path1 = watcherRoute.concat([stationId]);
		var path2 = [stationId].concat(watcherRoute);
		
		var watchers1 = this.watchers.read(path1);
		var watchers2 = this.stationsToWatch.read(path2);
		
		var item;
		
		if (watchers1)
		{
			for (var i = 0;i < watchers1.length;i ++)
			{
				item = watchers1[i];
				
				if (item.up == watchUp && item.down == watchDown)
				{
					watchers1.splice(i, 1);
					
					sys.log("2.ConnectionsManager[stopWatchConnection][REMOVE]: " + i + " : " + watchers1.length);
					
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
					
					sys.log("3.ConnectionsManager[stopWatchConnection][REMOVE]: " + i + " : " + watchers2.length);
					
					break;
				}
			}
			
			if (watchers2.length == 0)
				this.stationsToWatch.unregister(path2);
		}
	}
};

//************************************************************************************************************************
//STOP WATCH
//************************************************************************************************************************

ConnectionsManager.prototype.disconnected = function(client)
{
	sys.log("1.ConnectionsManager[disconnected]");
	
	ServerEventDispatcher.prototype.disconnected.call(this, client);
	
	if (client.data.accountContext)
	{
		var accountContext = client.data.accountContext;
		accountContext.unregisterConnection(client);
		
		sys.log("4.ConnectionsManager[disconnected]: " + accountContext.totalConnections);
		
		if (accountContext.totalConnections == 0)
			this.context.accountsDataManager.logout(accountContext);
		
		sys.log("5.ConnectionsManager[disconnected]---------------");
	}
};
