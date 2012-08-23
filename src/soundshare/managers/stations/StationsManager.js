var sys = require('sys');
var flashsocket = require('flashsocket');

var ServerEventDispatcher = flashsocket.ServerEventDispatcher;
var ObjectRegister = flashsocket.ObjectRegister;

StationsManager = module.exports = function(context)
{
	ServerEventDispatcher.call(this);
	
	this.setId("STATIONS_MANAGER");
	this.context = context;
	
	this.stationsById = new Array();
	this.stationsBySesstionId = new Array();
	
	this.watchers = new ObjectRegister();
	this.stationsToWatch = new ObjectRegister();
	
	var _self = this;
	
	this.addAction("GET_STATION_BROADCAST_SETTINGS", function(client, message) {
		_self.executeGetBroadcastSettings(client, message);
	});
	
	this.addAction("STATION_UP", function(client, message) {
		_self.executeStationUp(client, message);
	});
	
	this.addAction("STATION_DOWN", function(client, message) {
		_self.execueStationDown(client, message);
	});
	
	this.addAction("START_WATCH", function(client, message) {
		_self.executeStartWatchStations(client, message);
	});
	
	this.addAction("STOP_WATCH", function(client, message) {
		_self.executeStopWatchStations(client, message);
	});
	
	this.addAction("SHUT_DOWN_STATION", function(client, message) {
		_self.shutDownStation(client, message);
	});
};

StationsManager.prototype = new ServerEventDispatcher();
StationsManager.prototype.executeGetBroadcastSettings = function(client, message)
{
	var header = message.getJSONHeader();
	var body = message.getJSONBody();
	
	var sender = header.route.sender;
	
	var stationId = body ? body.stationId : null;
	
	sys.log("StationsManager[executeGetBroadcastSettings]: " + stationId);
	
	if (sender)
	{
		if (stationId)
		{
			if (!this.stationsById[stationId])
			{
				client.data.stationId = stationId;
				
				this.stationsById[stationId] = client;
				this.stationsBySesstionId[client.sessionId] = stationId;
				
				this.dispatchSocketEvent({
					event: {
						type: "STATION_UP_COMPLETE"
					}, 
					receiver: sender
				});
				
				this.watchStationUp(stationId);
			}
			else
				this.dispatchSocketEvent({
					event: {
						type: "STATION_UP_ERROR",
						data: {
							error: "Station is already up!",
							code: 200
						}
					}, 
					receiver: sender
				});
		}
		else
			this.dispatchSocketEvent({
				event: {
					type: "STATION_UP_ERROR",
					data: {
						error: "Invalid station!",
						code: 201
					}
				}, 
				receiver: sender
			});
	}
};

StationsManager.prototype.executeStationUp = function(client, message)
{
	var header = message.getJSONHeader();
	var body = message.getJSONBody();
	
	var sender = header.route.sender;
	
	var stationId = body ? body.stationId : null;
	
	sys.log("StationsManager[executeStationUp]: " + stationId);
	
	if (sender)
	{
		if (stationId)
		{
			if (!this.stationsById[stationId])
			{
				client.data.stationId = stationId;
				
				this.stationsById[stationId] = client;
				this.stationsBySesstionId[client.sessionId] = stationId;
				
				this.dispatchSocketEvent({
					event: {
						type: "STATION_UP_COMPLETE"
					}, 
					receiver: sender
				});
				
				this.watchStationUp(stationId);
			}
			else
				this.dispatchSocketEvent({
					event: {
						type: "STATION_UP_ERROR",
						data: {
							error: "Station is already up!",
							code: 200
						}
					}, 
					receiver: sender
				});
		}
		else
			this.dispatchSocketEvent({
				event: {
					type: "STATION_UP_ERROR",
					data: {
						error: "Invalid station!",
						code: 201
					}
				}, 
				receiver: sender
			});
	}
};

StationsManager.prototype.execueStationDown = function(client, message)
{
	var header = message.getJSONHeader();
	var body = message.getJSONBody();
	
	var sender = header.route.sender;
	
	var stationId = body ? body.stationId : null;
	
	sys.log("StationsManager[execueStationDown]: " + stationId);
	
	if (sender)
	{
		if (stationId)
		{
			if (this.stationsById[stationId])
			{
				this.watchStationDown(stationId);
				
				client.data.stationId = null;
				
				delete(this.stationsById[stationId]);
				delete(this.stationsBySesstionId[client.sessionId]);
				
				this.dispatchSocketEvent({
					event: {
						type: "STATION_DOWN_COMPLETE"
					}, 
					receiver: sender
				});
			}
			else
				this.dispatchSocketEvent({
					event: {
						type: "STATION_DOWN_ERROR",
						data: {
							error: "Station is already down!",
							code: 200
						}
					}, 
					receiver: sender
				});
		}
		else
			this.dispatchSocketEvent({
				event: {
					type: "STATION_DOWN_ERROR",
					data: {
						error: "Invalid station!",
						code: 201
					}
				}, 
				receiver: sender
			});
	}
};

StationsManager.prototype.shutDownStation = function(client, message)
{
	var header = message.getJSONHeader();
	var body = message.getJSONBody();
	
	var sender = header.route.sender;
	var stationId = body ? body.stationId : null;
	
	sys.log("StationsManager[shutDownStation]: " + stationId);
	
	if (sender)
	{
		if (stationId)
		{
			var targetClient = client.data.accountContext.getConnectionByStationId(stationId);
			
			if (targetClient)
			{
				this.context.accountsManager.sendRemoteActionBySessionIdToClient(targetClient, "SHUT_DOWN_STATION");
				this.dispatchSocketEvent({
					event: {
						type: "SHIT_DOWN_STATION_COMPLETE", 
						data: {
							stationId: stationId
						}
					}, 
					receiver: sender
				});
			}
			else
				this.dispatchSocketEvent({
					event: {
						type: "SHIT_DOWN_STATION_ERROR", 
						data: {
							error: "Invalid station!",
							code: 202
						}
					}, 
					receiver: sender
				});
		}
		else
			this.dispatchSocketEvent({
				event: {
					type: "SHIT_DOWN_STATION_ERROR", 
					data: {
						error: "Invalid station data!",
						code: 203
					}
				}, 
				receiver: sender
			});
	}
};

//************************************************************************************************************************
// 													WATCH LOGIN
//************************************************************************************************************************

StationsManager.prototype.watchStationUp = function(stationId)
{
	var stationMap = this.stationsToWatch.buildObjectsMap([stationId], [stationId]);
	var receivers = new Array();
	
	if (stationMap && stationMap.length > 0)
		for (var i = 0;i < stationMap.length;i ++)
			for (var k = 0;k < stationMap[i].obj.length;k ++)
				if (stationMap[i].obj[k].down)
					receivers.push(stationMap[i].route);
	
	sys.log("StationsManager[watchStationUp]: " + receivers);
	
	if (receivers.length > 0)
	{
		var client = this.stationsById[stationId];
		
		this.dispatchSocketEvent({
			event: {
				type: "STATION_UP_DETECTED", 
				data: {
					stationId: stationId,
					routingMap: client.data.routingMap
				}
			}, 
			receivers: receivers
		});
	}
};

// ************************************************************************************************************************
// 													    WATCH LOGOUT
// ************************************************************************************************************************

StationsManager.prototype.watchStationDown = function(stationId)
{
	var stationMap = this.stationsToWatch.buildObjectsMap([stationId], [stationId]);
	var receivers = new Array();
	
	if (stationMap && stationMap.length > 0)
		for (var i = 0;i < stationMap.length;i ++)
			for (var k = 0;k < stationMap[i].obj.length;k ++)
				if (stationMap[i].obj[k].down)
					receivers.push(stationMap[i].route);
	
	sys.log("1.StationsManager[watchStationDown]: " + receivers);
	
	if (receivers.length > 0)
	{
		var client = this.stationsById[stationId];
		
		this.dispatchSocketEvent({
			event: {
				type: "STATION_DOWN_DETECTED", 
				data: {
					stationId: stationId,
					routingMap: client.data.routingMap
				}
			}, 
			receivers: receivers
		});
	}
};

// ************************************************************************************************************************
// 													    START WATCH
// ************************************************************************************************************************

StationsManager.prototype.executeStartWatchStations = function(client, message)
{
	var header = message.getJSONHeader();
	var body = message.getJSONBody();
	
	var sender = header.route.sender;
	
	var watchUp = body.up ? body.up : true;
	var watchDown = body.down ? body.down : true;
	var stations = body.stations;
	
	sys.log("1.StationsManager[executeStartWatchStations]: " + stations);
	
	if (sender)
	{
		if (stations)
		{
			this.startWatchStation(sender, stations, watchUp, watchDown, true);
			
			var stationsReport = new Object();
			
			for (var s in stations)
				stationsReport[stations[s]] = this.stationsById[stations[s]] ? {
					routingMap: this.stationsById[stations[s]].data.routingMap
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

StationsManager.prototype.startWatchStation = function(watcherRoute, stations, watchUp, watchDown)
{
	sys.log("StationsManager[startWatchStation]:" + watcherRoute +" : "+ stations +" : "+ watchUp +" : "+ watchDown);
	
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
// 													    STOP WATCH
// ************************************************************************************************************************

StationsManager.prototype.executeStopWatchStations = function(client, message)
{
	sys.log("StationsManager[executeStopWatchStations]:");
	
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
			this.stopWatchStation(sender, stations, watchUp, watchDown);
			
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

StationsManager.prototype.stopWatchStation = function(watcherRoute, stations, watchUp, watchDown)
{
	sys.log("StationsManager[stopWatchStation]:" + watcherRoute +" : "+ stations +" : "+ watchUp +" : "+ watchDown);
		
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
					
					sys.log("2.StationsManager[stopWatchStation][REMOVE]: " + i + " : " + watchers1.length);
					
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
					
					sys.log("3.StationsManager[stopWatchStation][REMOVE]: " + i + " : " + watchers2.length);
					
					break;
				}
			}
			
			if (watchers2.length == 0)
				this.stationsToWatch.unregister(path2);
		}
	}
};

StationsManager.prototype.disconnected = function(client)
{
	var stationId = this.stationsBySesstionId[client.sessionId];
	
	sys.log("1.StationsManager[disconnected]: " + stationId);
	
	if (stationId)
	{
		var accountContext = client.data.accountContext;
		this.context.channelsDataManager.clearBroadcasts(stationId, accountContext._id);
	}
	
	ServerEventDispatcher.prototype.disconnected.call(this, client);
	
	this.watchers.remove(client.data.route);
	this.stationsToWatch.removeByPattern(["*"].concat(client.data.route));
	
	if (stationId)
	{
		sys.log("2.StationsManager[disconnected]: " + stationId + ":" + client.sessionId);
		
		this.watchStationDown(stationId);
		
		delete(this.stationsById[stationId]);
		delete(this.stationsBySesstionId[client.sessionId]);
	}
};