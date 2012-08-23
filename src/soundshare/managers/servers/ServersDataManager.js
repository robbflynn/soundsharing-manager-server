var sys = require('sys');

var SecureMongoDBManager = require('../../db/SecureMongoDBManager');

ServersDataManager = module.exports = function(context)
{
	SecureMongoDBManager.call(this, context, "servers");
	
	this.init();
	
	this.insetActionName = "SERVER_INSERTED";
	this.updateActionName = "SERVER_UPDATED";
	this.deleteActionName = "SERVER_DELETED";
	
	var _self = this;
	
	this.rest.get('/servers/authorize/:serverId/:secureId', function(req, res){
	    _self.authorize(req, res);
	});
};

ServersDataManager.prototype = new SecureMongoDBManager();
ServersDataManager.prototype.authorize = function(req, res)
{
	var serverId = req.param("serverId");
	var secureId = req.param("secureId");
	
	sys.log("-authorize- " + serverId + " : " + secureId);
	
	if (serverId && secureId)
	{
		var _self = this;
		
		this.context.dbfacade.withCollection("servers").findOne({_id: serverId, secureId: secureId}, function(err, obj) {
			if (!err && obj)
			{
				var serverContext = _self.context.serversManager.getContextById(serverId);
				
				if (serverContext && serverContext.client)
					res.send({error: "Server is already active!", code: 2});
				else
				{
					if (serverContext)
						_self.context.serversManager.unregisterContext(serverContext);
					
					serverContext = new ServerContext();
					serverContext._id = serverId;
					serverContext.token = Math.uuidCompact();
					serverContext.address = obj.address;
					serverContext.port = obj.port;
					
					_self.context.serversManager.registerContext(serverContext);
					
					obj.token = serverContext.token;
					
					res.send({
						data: obj,
						settings: {
							socket: {
								address: _self.context.config.server.address,
								port: _self.context.config.socket.port
							}
						}
					});
				}
			}
			else
			if (!err && !obj)
				res.send({error: "Server does not exist!", code: 0});
			else
				res.send({error: "Error", code: 1});
		});
		
	}
	else
		res.send({error: "Invalid parameters!", code: 3});
};