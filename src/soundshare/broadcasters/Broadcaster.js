var sys = require('sys');
var events = require('events');

var ServerEventDispatcher = require('flashsocket-js').ServerEventDispatcher;

Broadcaster = module.exports = function(context)
{
	ServerEventDispatcher.call(this);
	
	this.broadcasterId = null;
	this.context = context;
	
	this.mediaInfo = null;
};

Broadcaster.prototype = new ServerEventDispatcher();
Broadcaster.prototype.process = function(client, message)
{
	var processed = this.processEvents(client, message);

	if (!processed)
	{
		var header =  message.getJSONHeader();
		
		if (header.type)
		{
			switch (header.type)
			{
				case "BROADCAST":
					this.executeBroadcast(client, message);
				break;
				case "BROADCAST_MEDIA_INFO":
					this.executeBroadcastMediaInfo(client, message);
				break;
				case "START_LISTEN":
					this.executeStartBroadcast(client, message);
				break;
				case "STOP_LISTEN":
					this.executeStopBroadcast(client, message);
				break;
			}
		}
	}
};

// ************************************************************************************************************************
// 													BROADCAST
// ************************************************************************************************************************

Broadcaster.prototype.executeBroadcast = function(client, message)
{
	//sys.log("Broadcaster[executeBroadcast]: " + this.broadcasterId);
	
	var headerData = message.getJSONHeader();
	
	this.dispatchEvent({
		event: {
			type: "BROADCAST_DATA"
		}, 
		eventBody: message.getBody()
	});
};

// ************************************************************************************************************************
// 													MEDIA INFO
// ************************************************************************************************************************

Broadcaster.prototype.executeBroadcastMediaInfo = function(client, message)
{
	//sys.log("Broadcaster[executeBroadcast]: " + this.broadcasterId);
	
	var headerData = message.getJSONHeader();
	var body = message.getJSONBody();
	
	if (body && body.mediaInfo)
	{
		var _self = this;
		
		this.mediaInfo = body.mediaInfo;
		
		this.dispatchEvent({
			event: {
				type: "BROADCAST_MEDIA_INFO_COMPLETE",
				data: {
					mediaInfo: _self.mediaInfo
				}
			}
		});
	}
};

// ************************************************************************************************************************
// 													START BROADCAST
// ************************************************************************************************************************

Broadcaster.prototype.executeStartBroadcast = function(client, message)
{
	var headerData = message.getJSONHeader();
	var targetId = headerData.targetId;
	
	if (targetId)
	{
		var _self = this;
		
		headerData.type = "ADD_EVENT_LISTENER";
		
		headerData.event = {type: "BROADCAST_DATA"};
		message.setHeader(new Buffer(JSON.stringify(headerData)));
		
		this.addEventListener(client, message);
		
		headerData.event = {type: "BROADCAST_MEDIA_INFO_COMPLETE"};
		message.setHeader(new Buffer(JSON.stringify(headerData)));
		
		this.addEventListener(client, message);
		
		
		this.dispatchEvent({
			event: {
				type: "BROADCAST_MEDIA_INFO_COMPLETE",
				data: {
					mediaInfo: _self.mediaInfo
				}
			}, 
			client: client,
			targetId: targetId
		});
		
		
		sys.log("Broadcaster[executeStartBroadcast]: " + sys.inspect(headerData));
	}
};


// ************************************************************************************************************************
// 													STOP BROADCAST
// ************************************************************************************************************************

Broadcaster.prototype.executeStopBroadcast = function(client, message)
{
	var headerData = message.getJSONHeader();
	headerData.type = "REMOVE_EVENT_LISTENER";
	headerData.event = {type: "BROADCAST_DATA"};
	
	var header = JSON.stringify(headerData);
	message.setHeader(new Buffer(header));
	
	sys.log("Broadcaster[executeStopBroadcast]: " + sys.inspect(headerData));
	
	this.removeEventListener(client, message);
};

// ************************************************************************************************************************
// 													    
// ************************************************************************************************************************