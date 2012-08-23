var events = require('events');

ServerContext = module.exports = function(connectTimeout)
{
	this._id = null;
	this.token = null;
	
	this.client = null;
	this.totalConnections = 0;
	
	this.plugins = new Array();
	
	this.connectTimeout = connectTimeout ? connectTimeout : 6000;
	
	var _self = this;
	
	this.destroyInterval = setTimeout(function() {
		if (!_self.client)
		{
			_self.reconnectInterval = null;
			_self.emit("connectionTimeout");
		}
	}, this.connectTimeout);
};

ServerContext.prototype = new events.EventEmitter();
ServerContext.prototype.connected = function()
{
	if (this.destroyInterval)
		clearTimeout(this.destroyInterval);
};