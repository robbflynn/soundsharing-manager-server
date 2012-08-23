var sys = require('sys');

var AccountContext = require('../../data/account/AccountContext');
var ObjectRegister = require('flashsocket-js').ObjectRegister;

var finderBuilder = require('../../../utils/mongodb/MongoDeepFinder').builder;

AccountsDataManager = module.exports = function(context)
{
	this.context = context;
	
	this.onlineById = new Array();
	this.onlineByToken = new Array();
	this.onlineByUsername = new Array();
	
	var rest = context.rest;
	var _self = this;
	
	rest.post('/accounts/login/:username/:password', function(req, res){
	    _self.executeLogin(req, res);
	});
	
	rest.post('/accounts/logout/:id', function(req, res){
	    _self.executeLogout(req, res);
	});
	
	rest.post('/accounts/register', function(req, res){
	    _self.executeRegister(req, res);
	});
	
	rest.post('/accounts/list', function(req, res){
	    _self.executeList(req, res);
	});
	
	rest.post('/accounts/data/:id', function(req, res){
	    _self.executeGetData(req, res);
	});
};

AccountsDataManager.prototype.validate = function(client, message)
{
	var header = message.getJSONHeader();
	var token = header.data ? header.data.token : null;
	
	//sys.log("AccountsDataManager[validate]: " + token + ":" + (token != null));
	
	//return token != null;
	return token && this.onlineByToken[token];
};

// ************************************************************************************************************************
// 													   LOGIN
// ************************************************************************************************************************

AccountsDataManager.prototype.executeLogin = function(req, res)
{
	var username = req.param("username");
	var password = req.param("password");
	
	var body = typeof req.body == "object" ? req.body : {};
	
	sys.log("1.AccountsDataManager[executeLogin]: " + username + ":" + password);
	
	if (username &&
		password)
	{
		var accountContext = this.onlineByUsername[username];
		
		if (!accountContext)
		{
			var _self = this;
			
			this.context.dbfacade.withCollection("accounts").findOne({
					username: username, 
					password: password
				}, 
				function(err, obj) {
			
					if (!err && obj)
					{
						var accountContext = new AccountContext();
						accountContext._id = obj._id;
						accountContext.token = Math.uuidCompact();
						accountContext.username = obj.username;
						accountContext.password = obj.password;
						
						sys.log("2.AccountsDataManager[executeLogin-not logged]: " + accountContext._id + " : " + accountContext.token);
						
						_self.onlineById[accountContext._id] = accountContext;
						_self.onlineByToken[accountContext.token] = accountContext;
						_self.onlineByUsername[accountContext.username] = accountContext;
						
						
						_self.context.dbfacade.withCollection("channels").find({accountId: accountContext._id}, function(err, channels) {
							_self.context.dbfacade.withCollection("playlists").find({accountId: accountContext._id}, function(err, playlists) {
								_self.context.dbfacade.withCollection("groups").find({accountId: accountContext._id}, function(err, groups) {
									_self.context.dbfacade.withCollection("notifications").find({receiverId: accountContext._id}, function(err, notifications) {
										_self.context.dbfacade.withCollection("stations").find({accountId: accountContext._id}, function(err, stations) {
											_self.context.dbfacade.withCollection("servers").find({accountId: accountContext._id}, function(err, servers) {
												
												sys.log("AccountsDataManager[executeGetData]: " + err +":"+ stations);
												
												res.send({
													data: {
														id: accountContext._id,
														token: accountContext.token,
														socket: {
															address: _self.context.config.server.address,
															port: _self.context.config.socket.port
														},
														accountData: {
															stations: stations ? stations : new Array(),
															servers: servers ? servers : new Array(),
															channels: channels ? channels : new Array(),
															playlists: playlists ? playlists : new Array(),
															groups: groups ? groups : new Array(),
															notifications: notifications ? notifications : new Array()
														},
														managers: {
															ACCOUNTS_REMOTE_DATA_MANAGER: _self.context.accountsManager.route,
															CONNECTIONS_MANAGER_ROUTE: _self.context.connectionsManager.route,
															BROADCASTS_MANAGER_ROUTE: _self.context.broadcastsManager.route,
															STATIONS_MANAGER_ROUTE: _self.context.stationsManager.route,
															SERVERS_MANAGER_ROUTE: _self.context.serversManager.route
														}
													}
												});
											});
										});
									});
								});
							});
						});
					}
					else
						res.send({error: "Wrong username or password!", code: 1});
			});
		}
		else
		{
			sys.log("2.AccountsDataManager[executeLogin-logged]: " + accountContext._id + " : " + accountContext.token);
			
			var _self = this;
			
			this.context.dbfacade.withCollection("channels").find({accountId: accountContext._id}, function(err, channels) {
				_self.context.dbfacade.withCollection("playlists").find({accountId: accountContext._id}, function(err, playlists) {
					_self.context.dbfacade.withCollection("groups").find({accountId: accountContext._id}, function(err, groups) {
						_self.context.dbfacade.withCollection("notifications").find({receiverId: accountContext._id}, function(err, notifications) {
							_self.context.dbfacade.withCollection("stations").find({accountId: accountContext._id}, function(err, stations) {
								_self.context.dbfacade.withCollection("servers").find({accountId: accountContext._id}, function(err, servers) {
									
									sys.log("AccountsDataManager[executeGetData]: " + err +":"+ stations);
									
									res.send({
										data: {
											id: accountContext._id,
											token: accountContext.token,
											socket: {
												address: _self.context.config.server.address,
												port: _self.context.config.socket.port
											},
											accountData: {
												stations: stations ? stations : new Array(),
												servers: servers ? servers : new Array(),
												channels: channels ? channels : new Array(),
												playlists: playlists ? playlists : new Array(),
												groups: groups ? groups : new Array(),
												notifications: notifications ? notifications : new Array()
											},
											managers: {
												ACCOUNTS_REMOTE_DATA_MANAGER: _self.context.accountsManager.route,
												CONNECTIONS_MANAGER_ROUTE: _self.context.connectionsManager.route,
												BROADCASTS_MANAGER_ROUTE: _self.context.broadcastsManager.route,
												STATIONS_MANAGER_ROUTE: _self.context.stationsManager.route,
												SERVERS_MANAGER_ROUTE: _self.context.serversManager.route
											}
										}
									});
								});
							});
						});
					});
				});
			});
		}
	}
	else
		res.send({error: "Error", code: 0});
};

AccountsDataManager.prototype.executeLogout = function(req, res)
{
	sys.log("AccountsDataManager[executeLogout]: ");
};

AccountsDataManager.prototype.logout = function(accountContext)
{
	sys.log("AccountsDataManager[logout]: ");
	
	delete(this.onlineById[accountContext._id]);
	delete(this.onlineByToken[accountContext.token]);
	delete(this.onlineByUsername[accountContext.username]);
};

AccountsDataManager.prototype.executeRegister = function(req, res)
{
	sys.log("AccountsDataManager[executeRegister]: ");
	
	var _self = this;
	var account = typeof req.body == "object" ? req.body : {};
	account._id = Math.uuidCompact();
	
	if (account.username &&
		account.password)
	{
		this.context.dbfacade.withCollection("accounts").findOne({username: account.username}, function(err, obj) {
			if (!err && !obj)
			{
				var group = {
						_id: Math.uuidCompact(),
						name: "-FRIENDS-",
						type: 0,
						deletable: false,
						accountId: account._id
					};
				
				_self.context.dbfacade.withCollection("groups").insert(group, function(err, gdoc) {
					if (!err && gdoc)
						_self.context.dbfacade.withCollection("accounts").insert(account, function(err, adoc) {
							if (!err && adoc)
								res.send({data: adoc});
							else
								res.send({error: "Error", code: 0});
						});
					else
						res.send({error: "Error", code: 0});
				});
			}
			else
				res.send({error: "Error", code: 0});
		});
	}
	else
		res.send({error: "Error", code: 0});
};

AccountsDataManager.prototype.executeList = function(req, res)
{
sys.log("-AccountsDataManager[executeList]- " + req + " : " + (typeof req.body) + " : " + (req.body));
	
	var expression = typeof req.body == "object" ? req.body : {};
	
	sys.log("-AccountsDataManager[executeList]-" + sys.inspect(expression));
	
	this.context.dbfacade.withCollection("accounts").find(expression, function(err, collection) {
		if (!err)
			res.send({data: collection});
		else
			res.send({error: "Error", code: 0});
	});
};

AccountsDataManager.prototype.executeGetData = function(req, res)
{
	var id = req.param("id");
	var _self = this;
	
	sys.log("AccountsDataManager[executeGetData]: " + id);
	
	if (id)
	{
		this.context.dbfacade.withCollection("accounts").findOne({_id: id}, function(err, account) {
			if (!err && account)
				_self.context.dbfacade.withCollection("channels").find({accountId: id}, function(err, channels) {
					_self.context.dbfacade.withCollection("playlists").find({accountId: id}, function(err, playlists) {
						_self.context.dbfacade.withCollection("groups").find({accountId: id}, function(err, groups) {
							
							sys.log("AccountsDataManager[executeGetData]: " + err +":"+ groups);
							
							res.send({
								data: {
									account: account,
									channels: channels ? channels : new Array(),
									playlists: playlists ? playlists : new Array(),
									groups: groups ? groups : new Array()
								}
							});
						});
					});
				});
			else
				res.send({error: "Invalid ID!", code: 0});
		});
	}
	else
		res.send({error: "Error!", code: 0});
};

AccountsDataManager.prototype.getAccountById = function(id)
{
	return this.onlineById[id];
};

AccountsDataManager.prototype.getAccountByTokenId = function(token)
{
	return this.onlineByToken[token];
};

// ************************************************************************************************************************
// ************************************************************************************************************************