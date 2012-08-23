var sys = require('sys');

AccountContext = module.exports = function()
{
	this._id = null;
	this.token = null;
	
	this.username = null;
	this.password = null;
	
	this.connections = new Array();
	this.totalConnections = 0;
};

//****************************************************************************************************************
//													CONNECTIONS
//****************************************************************************************************************

AccountContext.prototype.registerConnection = function(client)
{
	client.data.accountContext = this;
	
	this.totalConnections ++;
	this.connections[client.sessionId] = client;
	
	sys.log("###########: AccountContext[registerConnection]: " + client.sessionId + ":" + client.data.accountContext);
};

AccountContext.prototype.unregisterConnection = function(client)
{
	client.data.accountContext = null;
	
	this.totalConnections --;
	delete(this.connections[client.sessionId]);
};

AccountContext.prototype.unregisterConnectionBySessionId = function(sessionId)
{
	if (this.connections[sessionId])
	{
		this.connections[sessionId].data.accountContext = null;
		
		this.totalConnections --;
		delete(this.connections[sessionId]);
	}
};

AccountContext.prototype.getConnectionBySessionId = function(sessionId)
{
	return this.connections[sessionId];
};

AccountContext.prototype.getConnectionByStationId = function(stationId)
{
	for (var s in this.connections)
		if (this.connections[s].data.stationId == stationId)
			return this.connections[s];
	
	return null;
};

//****************************************************************************************************************
//
//****************************************************************************************************************

AccountContext.prototype.getClientsReceivers = function(client, namespace)
{
	var receivers = new Array();
	
	for (var s in this.connections)
		if (client != this.connections[s] && this.connections[s].data.routingMap && this.connections[s].data.routingMap[namespace])
			receivers.push(this.connections[s].data.routingMap[namespace]);
	
	return receivers;
};

AccountContext.prototype.getClientReceiver = function(client, namespace)
{
	return client.data.routingMap && client.data.routingMap[namespace] ? client.data.routingMap[namespace] : null;
};

//****************************************************************************************************************
//****************************************************************************************************************