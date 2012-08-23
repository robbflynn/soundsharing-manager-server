var sys = require('sys');

MongoDBManager = module.exports = function(collection, dbfacade, rest)
{
	this.collection = collection;
	this.dbfacade = dbfacade;
	this.rest = rest;
};

MongoDBManager.prototype.init = function(settings)
{
	var _self = this;
	
	if (!settings || settings.list)
		this.defineMethod('/list', function(req, res){
		    _self.executeList(req, res);
		});
	
	if (!settings || settings.get)
		this.defineMethod('/get/:id', function(req, res){
		    _self.executeGet(req, res);
		});
	
	if (!settings || settings.insert)
		this.defineMethod('/insert', function(req, res){
		    _self.executeInsert(req, res);
		});
	
	if (!settings || settings.update)
		this.defineMethod('/update/:id', function(req, res){
		    _self.executeUpdate(req, res);
		});
	
	if (!settings || settings.del)
		this.defineMethod('/delete', function(req, res){
		    _self.executeDelete(req, res);
		});
};

// *********************************************************************************************************************
//*********************************************************************************************************************

MongoDBManager.prototype.defineMethod = function(path, result)
{
	var _self = this;
	
	this.rest.post(this.baseURL() + path, function(req, res, next) {_self.requestMiddleware(req, res, next);}, result);
};

MongoDBManager.prototype.baseURL = function()
{
	return '/' + this.collection;
};

MongoDBManager.prototype.requestMiddleware = function(req, res, next)
{
	next();
};

//*********************************************************************************************************************
//*********************************************************************************************************************

MongoDBManager.prototype.executeGet = function(req, res, result)
{
	var id = req.param("id");
	
	sys.log("-MongoDBManager[executeGet]- " + id);
	
	this.dbfacade.withCollection(this.collection).findOne({_id: id}, function(err, obj) {
		if (!err && obj)
			res.send({data: obj});
		else
			res.send({error: "Error", code: 0});
		
		if (result)
			result(arguments);
	});
};

MongoDBManager.prototype.executeList = function(req, res, result)
{
	var expression = typeof req.body == "object" ? req.body : {};
	
	sys.log("-MongoDBManager[executeList]-", sys.inspect(expression));
	
	this.dbfacade.withCollection(this.collection).find(expression, function(err, collection) {
		if (!err && collection)
		{
			res.send({data: collection});
			
			if (result)
				result(null, collection);
		}
			
		else
		{
			var e = {
				error: "Error", 
				code: 0
			};
			
			res.send(e);
			
			if (result)
				result(e);
		}
	});
};

MongoDBManager.prototype.executeInsert = function(req, res, result)
{
	var obj = req.body;
	
	sys.log("1.-MongoDBManager[executeInsert]- " + sys.inspect(obj));
	
	obj._id = Math.uuidCompact();
	
	this.dbfacade.withCollection(this.collection).insert(obj, function(err, doc) {
		
		sys.log("2.-MongoDBManager[executeInsert]- " + err);
		
		if (!err && doc)
		{
			res.send({data: doc[0]});
			result(null, doc[0]);
		}
		else
		{
			var e = {
					error: "Error", 
					code: 0
				};
			
			res.send(e);
			result(e);
		}
	});
};

MongoDBManager.prototype.executeUpdate = function(req, res, result)
{
	var obj = req.body;
	var id = req.param("id");
	
	var _self = this;
	
	sys.log("-MongoDBManager[executeUpdate]- " + id + " : " + sys.inspect(obj));
	
	this.dbfacade.withCollection(this.collection).update({_id: id}, {$set: obj}, function(err, success) {
		if (!err && success)
			_self.dbfacade.withCollection(_self.collection).findOne({_id: id}, function(err, obj) {
				if (!err && obj)
				{
					res.send({data: obj});
					result(null, obj);
				}
				else
				{
					var e = {
							error: "Error", 
							code: 0
						};
					
					res.send(e);
					result(e);
				}
			});
		else
		{
			var e = {
					error: "Error", 
					code: 0
				};
			
			res.send(e);
			result(e);
		}
	});
};

MongoDBManager.prototype.executeDelete = function(req, res, result)
{
	var expression = typeof req.body == "object" ? req.body : {};
		
	sys.log("1.-MongoDBManager[executeDelete]- " + sys.inspect(expression));
	
	this.dbfacade.withCollection(this.collection).remove(expression, function(err, success) {
		
		sys.log("2.-MongoDBManager[executeDelete]- " + err);
		
		if (!err && success)
		{
			res.send({data: expression});
			result(null, expression);
		}
		else
		{
			var e = {
					error: "Error", 
					code: 0
				};
			
			res.send(e);
			result(e);
		}
	});
};