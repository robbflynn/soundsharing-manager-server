StationContext = module.exports = function()
{
	this._id = null;
	this.client = null;
	this.managers = null;
	this.stationId = null;
};

StationContext.prototype.getAccountRemoteDataManagerRoute = function()
{
	return this.managers["ACCOUNT_REMOTE_DATA_MANAGER_ROUTE"];
};