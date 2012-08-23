var sys = require('sys');

var MongoDBManager = require('./base/MongoDBManager');

SecureMongoDBManager = module.exports = function(context, collection)
{
	if (arguments.length == 0)
		return ;
	
	MongoDBManager.call(this, collection, context.dbfacade, context.rest);
	
	this.context = context;
	
	this.insetActionName = null;
	this.updateActionName = null;
	this.deleteActionName = null;
};

SecureMongoDBManager.prototype = new MongoDBManager();
SecureMongoDBManager.prototype.init = function(settings)
{
	var _self = this;
	
	if (!settings || settings.insert)
		this.defineMethod('/insert/:sessionId', function(req, res){
		    _self.executeInsert(req, res);
		});
	
	if (!settings || settings.update)
		this.defineMethod('/update/:id/:sessionId', function(req, res){
		    _self.executeUpdate(req, res);
		});
	
	if (!settings || settings.del)
		this.defineMethod('/delete/:sessionId', function(req, res){
		    _self.executeDelete(req, res);
		});
	
	if (!settings || settings.list)
		this.defineMethod('/list', function(req, res){
		    _self.executeList(req, res);
		});
	
	if (!settings || settings.get)
		this.defineMethod('/get/:id', function(req, res){
		    _self.executeGet(req, res);
		});
};

SecureMongoDBManager.prototype.requestMiddleware = function(req, res, next)
{
	var token = req.param("token");
	
	if (token)
	{
		if (this.context.accountsDataManager.getAccountByTokenId(token))
			next();
		else
			res.send({error: "Security error!", code: 666});
	}
	else
		res.send({error: "Security error!", code: 666});
};

SecureMongoDBManager.prototype.baseURL = function()
{
	return '/' + this.collection + "/:token";
};

//*********************************************************************************************************************
//*********************************************************************************************************************

SecureMongoDBManager.prototype.executeInsert = function(req, res, result)
{
	var _self = this;
	var sessionId = req.param("sessionId");
	
	sys.log("1.-SecureMongoDBManager[executeInsert]- " + sessionId);
	
	MongoDBManager.prototype.executeInsert.call(this, req, res, function(err, obj) {
		if (!err && _self.insetActionName)
			_self.context.accountsManager.sendRemoteActionBySessionId(sessionId, _self.insetActionName, obj);
	});
};

SecureMongoDBManager.prototype.executeUpdate = function(req, res, result)
{
	var _self = this;
	var sessionId = req.param("sessionId");
	
	sys.log("1.-SecureMongoDBManager[executeUpdate]- " + sessionId);
	
	MongoDBManager.prototype.executeUpdate.call(this, req, res, function(err, obj) {
		if (!err && _self.updateActionName)
			_self.context.accountsManager.sendRemoteActionBySessionId(sessionId, _self.updateActionName, obj);
	});
};

SecureMongoDBManager.prototype.executeDelete = function(req, res, result)
{
	var _self = this;
	var sessionId = req.param("sessionId");
	
	sys.log("1.-SecureMongoDBManager[executeDelete]- " + sessionId);
	
	MongoDBManager.prototype.executeDelete.call(this, req, res, function(err, obj) {
		if (!err && _self.deleteActionName)
			_self.context.accountsManager.sendRemoteActionBySessionId(sessionId, _self.deleteActionName, obj);
	});
};