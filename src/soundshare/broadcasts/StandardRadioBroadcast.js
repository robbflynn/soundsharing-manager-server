var sys = require('sys');

var ServerEventDispatcher = require('flashsocket-js').ServerEventDispatcher;

StandardRadioBroadcast = module.exports = function(context)
{
	ServerEventDispatcher.call(this);
	
	this.xtype = "STANDARD_RADIO_BROADCAST";
	this.audioInfoData = null;
	
	this.listenersByType = new Array();
	
	var _self = this;
	
	this.addAction("BROADCAST_AUDIO_DATA", function(client, message) {
		_self.executeBroadcast(client, message);
	});
	
	this.addAction("SET_AUDIO_INFO_DATA", function(client, message) {
		_self.executeSetAudioInfoData(client, message);
	});
	
	this.addAction("GET_AUDIO_INFO_DATA", function(client, message) {
		_self.executeGetAudioInfoData(client, message);
	});
	
	/*this.addAction("START_LISTEN", function(client, message) {
		_self.executeStartListenBroadcast(client, message);
	});
	
	this.addAction("STOP_LISTEN", function(client, message) {
		_self.executeStopListenBroadcast(client, message);
	});*/
};

StandardRadioBroadcast.prototype = new ServerEventDispatcher();
StandardRadioBroadcast.prototype.executeBroadcast = function(client, message)
{
	sys.log("StandardRadioBroadcast[executeBroadcast]: ");
	
	this.dispatchSocketEvent({
		event: {
			type: "AUDIO_DATA"
		}, 
		eventBody: message.getBody()
	});
};

StandardRadioBroadcast.prototype.executeSetAudioInfoData = function(client, message)
{
	var body = message.getJSONBody();
	
	this.audioInfoData = body.audioInfoData;
	
	this.dispatchSocketEvent({
		event: {
			type: "AUDIO_INFO_DATA",
			data: this.audioInfoData
		}
	});
};

StandardRadioBroadcast.prototype.executeGetAudioInfoData = function(client, message)
{
	var header = message.getJSONHeader();
	var sender = header.route.sender;
	
	this.dispatchSocketEvent({
		event: {
			type: "AUDIO_INFO_DATA",
			data: this.audioInfoData
		}, 
		receiver: sender
	});
};

StandardRadioBroadcast.prototype.disconnected = function(client)
{
	this.dispatchSocketEvent({
		event: {
			type: "CONNECTION_LOST"
		}
	});
	
	ServerEventDispatcher.prototype.disconnected.call(this, client);
};

// ************************************************************************************************************************
// 													START BROADCAST
// ************************************************************************************************************************
/*
StandardRadioBroadcast.prototype.executeStartListenBroadcast = function(client, message)
{
	var header = message.getJSONHeader();
	var sender = header.route.sender;
	
	sys.log("StandardRadioBroadcast[executeStartListenBroadcast]: " + sender);
	
	return ;
	
	if (sender)
	{
		var _self = this;
		
		// Add audio data listener
		
		header.data.action.xtype = "ADD_EVENT_LISTENER";
		header.data.action.event = {
			type: "AUDIO_DATA"
		};
		
		message.setHeader(new Buffer(JSON.stringify(header)));
		this.addEventListener(client, message);
		
		// Add audio info data listener
		
		header.data.action.event = {
			type: "AUDIO_INFO_DATA"
		};
		
		message.setHeader(new Buffer(JSON.stringify(header)));
		this.addEventListener(client, message);
		
		// Add broadcast connection lost listener
		
		header.data.action.event = {
			type: "BROADCAST_CONNECTION_LOST"
		};
		
		message.setHeader(new Buffer(JSON.stringify(header)));
		this.addEventListener(client, message);
		
		
		this.dispatchSocketEvent({
			event: {
				type: "AUDIO_INFO_DATA",
				data: _self.audioInfoData
			}, 
			client: client,
			targetId: targetId
		});
		
		var _self = this;
		var fn = function () { _self.onDisconnectClient(client, message, fn); };
		
		client.on("disconnect", fn);
		
		sys.log("StandardRadioBroadcast[executeStartListenBroadcast]: " + sys.inspect(header, 10));
	}
};


StandardRadioBroadcast.prototype.onDisconnectClient = function(client, message, fn)
{
	client.removeListener("disconnect", fn);
	this.executeStopListenBroadcast(client, message);
}

// ************************************************************************************************************************
// 													STOP BROADCAST
// ************************************************************************************************************************

StandardRadioBroadcast.prototype.executeStopListenBroadcast = function(client, message)
{
	var header = message.getJSONHeader();
	
	// Remove audio data listener
	
	header.data.action.xtype = "REMOVE_EVENT_LISTENER";
	header.data.action.event = {
		type: "AUDIO_DATA"
	};
	
	message.setHeader(new Buffer(JSON.stringify(header)));
	this.removeEventListener(client, message);
	
	// Remove audio info data listener
	
	header.data.action.event = {
		type: "AUDIO_INFO_DATA"
	};
	
	message.setHeader(new Buffer(JSON.stringify(header)));
	this.removeEventListener(client, message);
	
	// Remove broadcast connection lost listener
	
	header.data.action.event = {
		type: "BROADCAST_CONNECTION_LOST"
	};
	
	message.setHeader(new Buffer(JSON.stringify(header)));
	this.removeEventListener(client, message);
	
	sys.log("StandardRadioBroadcast[executeStopListenBroadcast]: " + sys.inspect(header));
};

// ************************************************************************************************************************
// 													STOP BROADCAST
// ************************************************************************************************************************

StandardRadioBroadcast.prototype.stopBroadcast = function()
{
	sys.log("1.StandardRadioBroadcast[stopBroadcast]: ");
	
	this.dispatchSocketEvent({
		event: {
			type: "BROADCAST_CONNECTION_LOST"
		}
	});
		
	sys.log("2.StandardRadioBroadcast[stopBroadcast]: ");
	
	// this.removeAll();
}
*/
// ************************************************************************************************************************
// 													    
// ************************************************************************************************************************