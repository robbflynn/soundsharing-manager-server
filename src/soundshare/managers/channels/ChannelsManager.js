var sys = require('sys');
var flashsocket = require('flashsocket-js');

var ServerEventDispatcher = flashsocket.ServerEventDispatcher;
var ObjectRegister = flashsocket.ObjectRegister;

ChannelsManager = module.exports = function(context)
{
	ServerEventDispatcher.call(this);
	
	this.setId("CHANNELS_MANAGER");
	this.context = context;
	
	this.watchers = new ObjectRegister();
	this.channelsToWatch = new ObjectRegister();
	
	var _self = this;
	
	this.addAction("START_WATCH", function(client, message) {
		_self.executeStartWatchChannels(client, message);
	});
	
	this.addAction("STOP_WATCH", function(client, message) {
		_self.executeStopWatchChannels(client, message);
	});
};

ChannelsManager.prototype = new ServerEventDispatcher();

//************************************************************************************************************************
// 													
//************************************************************************************************************************

ChannelsManager.prototype.watchChannelActivation = function(channelId, obj)
{
	var channelMap = this.channelsToWatch.buildObjectsMap([channelId], [channelId]);
	var receivers = new Array();
	
	if (channelMap && channelMap.length > 0)
		for (var i = 0;i < channelMap.length;i ++)
			for (var k = 0;k < channelMap[i].obj.length;k ++)
				if (channelMap[i].obj[k].deactivation)
					receivers.push(channelMap[i].route);
	
	sys.log("ChannelsManager[watchChannelActive]: " + receivers);
	
	if (receivers.length > 0)
		this.dispatchSocketEvent({
			event: {
				type: "CHANNEL_ACTIVATION_DETECTED", 
				data: obj
			}, 
			receivers: receivers
		});
};

// ************************************************************************************************************************
// 													    
// ************************************************************************************************************************

ChannelsManager.prototype.watchChannelDeactivation = function(channelId, obj)
{
	var channelMap = this.channelsToWatch.buildObjectsMap([channelId], [channelId]);
	var receivers = new Array();
	
	if (channelMap && channelMap.length > 0)
		for (var i = 0;i < channelMap.length;i ++)
			for (var k = 0;k < channelMap[i].obj.length;k ++)
				if (channelMap[i].obj[k].deactivation)
					receivers.push(channelMap[i].route);
	
	sys.log("1.ChannelsManager[watchChannelDeactive]: " + receivers);
	
	if (receivers.length > 0)
		this.dispatchSocketEvent({
			event: {
				type: "CHANNEL_DEACTIVATION_DETECTED", 
				data: obj
			}, 
			receivers: receivers
		});
};

// ************************************************************************************************************************
// 													    START WATCH
// ************************************************************************************************************************

ChannelsManager.prototype.executeStartWatchChannels = function(client, message)
{
	var header = message.getJSONHeader();
	var body = message.getJSONBody();
	
	var sender = header.route.sender;
	
	var watchActive = body.activation ? body.activation : true;
	var watchDeactive = body.deactivation ? body.deactivation : true;
	var channels = body.channels;
	
	sys.log("1.ChannelsManager[executeStartWatchChannels]: " + channels + " : " + sys.inspect(channels));
	
	if (sender)
	{
		if (channels)
		{
			this.startWatchChannel(sender, channels, watchActive, watchDeactive, true);
			
			var channelsReport = new Object();
			var _self = this;
			
			var chs = new Array();
			
			for (var s in channels) 
				chs.push(channels[s]);
			
			sys.log("2.ChannelsManager[executeStartWatchChannels]: " + chs);
			
			this.context.channelsDataManager.listItems({_id : {$in : chs}}, function(err, collection) {
				
				sys.log("3.ChannelsManager[executeStartWatchChannels]: " + err +" : "+ sys.inspect(collection));
				
				if (!err && collection)
				{
					var channelId;
					var data;
					
					for (var s1 in channels)
					{
						channelId = channels[s1];
						channelData = null;
						
						for (var s2 in collection)
						{
							if (channelId == collection[s2]._id)
							{
								channelData = collection[s2];
								break;
							}
						}
						
						channelsReport[channelId] = channelData ? channelData : false;
					}
						
					_self.dispatchSocketEvent({
						event: {
							type: "START_WATCH_COMPLETE",
							data: {
								channelsReport: channelsReport
							}
						}, 
						receiver: sender
					});
				}
				else
				{
					_self.dispatchSocketEvent({
						event: {
							type: "START_WATCH_ERROR"
						}, 
						receiver: sender
					});
				}
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

ChannelsManager.prototype.startWatchChannel = function(watcherRoute, channels, watchActive, watchDeactive)
{
	sys.log("ChannelsManager[startWatchChannel]:" + watcherRoute +" : "+ channels +" : "+ watchActive +" : "+ watchDeactive);
	
	var channelId;
	var listener;
	
	for (var s in channels)
	{
		channelId = channels[s];
		
		listener = {
			activation: watchActive, 
			deactivation: watchDeactive
		};
		
		var path1 = watcherRoute.concat([channelId]);
		var path2 = [channelId].concat(watcherRoute);
		
		var watchers1 = this.watchers.read(path1);
		var watchers2 = this.channelsToWatch.read(path2);
		
		if (!watchers1)
		{
			watchers1 = new Array();
			this.watchers.register(path1, watchers1);
		}
			
		watchers1.push(listener);
		
		if (!watchers2)
		{
			watchers2 = new Array();
			this.channelsToWatch.register(path2, watchers2);
		}
			
		watchers2.push(listener);
	}
};

// ************************************************************************************************************************
// 													    STOP WATCH
// ************************************************************************************************************************

ChannelsManager.prototype.executeStopWatchChannels = function(client, message)
{
	sys.log("ChannelsManager[executeStopWatchChannels]:");
	
	var header = message.getJSONHeader();
	var body = message.getJSONBody();
	
	var sender = header.route.sender;
	
	var watchActive = body.activation ? body.activation : true;
	var watchDeactive = body.deactivation ? body.deactivation : true;
	var channels = body.channels;
		
	if (sender)
	{
		if (channels)
		{
			this.stopWatchChannel(sender, channels, watchActive, watchDeactive);
			
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

ChannelsManager.prototype.stopWatchChannel = function(watcherRoute, channels, watchActive, watchDeactive)
{
	sys.log("ChannelsManager[stopWatchChannel]:" + watcherRoute +" : "+ channels +" : "+ watchActive +" : "+ watchDeactive);
		
	var channelId;
	var channelContext;
	
	for (var s in channels)
	{
		channelId = channels[s];
		
		var path1 = watcherRoute.concat([channelId]);
		var path2 = [channelId].concat(watcherRoute);
		
		var watchers1 = this.watchers.read(path1);
		var watchers2 = this.channelsToWatch.read(path2);
		
		var item;
		
		if (watchers1)
		{
			for (var i = 0;i < watchers1.length;i ++)
			{
				item = watchers1[i];
				
				if (item.activation == watchActive && item.deactivation == watchDeactive)
				{
					watchers1.splice(i, 1);
					
					sys.log("2.ChannelsManager[stopWatchChannel][REMOVE]: " + i + " : " + watchers1.length);
					
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
				
				if (item.activation == watchActive && item.deactivation == watchDeactive)
				{
					watchers2.splice(i, 1);
					
					sys.log("3.ChannelsManager[stopWatchChannel][REMOVE]: " + i + " : " + watchers2.length);
					
					break;
				}
			}
			
			if (watchers2.length == 0)
				this.channelsToWatch.unregister(path2);
		}
	}
};

ChannelsManager.prototype.disconnected = function(client)
{
	sys.log("1.ChannelsManager[disconnected]: ");
	
	ServerEventDispatcher.prototype.disconnected.call(this, client);
	
	this.watchers.remove(client.data.route);
	this.channelsToWatch.removeByPattern(["*"].concat(client.data.route));
};