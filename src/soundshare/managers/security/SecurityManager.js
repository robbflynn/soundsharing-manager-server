var sys = require('sys');

SecurityManager = module.exports = function()
{
	this.authorizedByToken = new Array();
	//this.authorizedBySessionId = new Array();
};

SecurityManager.prototype.validateByToken = function(token)
{
	return this.authorizedByToken[obj.token] ? true : false;
};

SecurityManager.prototype.authorize = function(obj)
{
	if (obj.token)
		this.authorizedByToken[obj.token] = obj;
	
	/*if (obj.client)
		this.authorizedBySessionId[obj.client.sessionId] = obj;*/
};

SecurityManager.prototype.unauthorize = function(obj)
{
	if (obj.token && this.authorizedByToken[obj.token])
		delete(this.authorizedByToken[obj.token]);
	
	/*if (obj.client && this.authorizedBySessionId[obj.client.sessionId])
		delete(this.authorizedBySessionId[obj.client.sessionId]);*/
};