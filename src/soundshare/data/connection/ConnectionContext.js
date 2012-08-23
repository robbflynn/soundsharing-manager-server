ConnectionContext = module.exports = function()
{
	this.client = null;
	this.managers = null;
	this.stationId = null;
};

ConnectionContext.prototype.reset = function()
{
	this.client = null;
	this.managers = null;
	this.stationId = null;
};

ConnectionContext.prototype.getAccountRemoteDataManagerRoute = function()
{
	return this.managers["ACCOUNT_REMOTE_DATA_MANAGER_ROUTE"];
};

ConnectionContext.prototype.getRemoteBroadcastsManagerRoute = function()
{
	return this.managers["REMOTE_BROADCASTS_MANAGER_ROUTE"];
};