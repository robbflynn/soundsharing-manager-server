var sys = require('sys');
var flashsocket = require('flashsocket-js');

var ServerEventDispatcher = flashsocket.ServerEventDispatcher;
var ObjectRegister = flashsocket.ObjectRegister;

var AccountContext = require('../../data/account/AccountContext');

AccountsManager = module.exports = function(context)
{
	ServerEventDispatcher.call(this);
	
	this.context = context;
	
	var _self = this;
	
	this.addAction("REGISTER_CONNECTION", function(client, message) {
		_self.executeRegisterAccountConnection(client, message);
	});
};

AccountsManager.prototype = new ServerEventDispatcher();
AccountsManager.prototype.executeRegisterAccountConnection = function(client, message)
{
	var header = message.getJSONHeader();
	var body = message.getJSONBody();
	
	var sender = header.route.sender;
	var token = body && body.token ? body.token : null;
	
	var accountContext = this.context.accountsDataManager.getAccountByTokenId(token);
	accountContext.registerConnection(client);
	
	sys.log("ConnectionsManager[executeRegisterAccountConnection]: " + token + ":" + accountContext);
};

AccountsManager.prototype.sendRemoteActionBySessionId = function(sessionId, name, data)
{
	var client = this.context.socket.server.getClientBySessionId(sessionId);
	var accountContext = client.data.accountContext;
	
	sys.log("1.AccountsManager[sendRemoteActionBySessionId]: " + sessionId + ":" + client);
	
	var receivers = accountContext.getClientsReceivers(client, this.namespace);
	
	sys.log("2.AccountsManager[sendRemoteActionBySessionId]: " + (receivers ? receivers.length : "NULL"));
	
	if (receivers.length > 0)
		this.sendAction({
			xtype: "PROCESS_ACTION",
			data: {
				name: name,
				data: data
			}, 
			receivers: receivers
		});
};

AccountsManager.prototype.sendRemoteActionByAccountId = function(accountId, name, data)
{
	var accountContext = this.context.accountsDataManager.getAccountById(accountId);
	
	sys.log("1.AccountsManager[sendRemoteActionByAccountId]: " + accountContext);
	
	if (accountContext)
	{
		var receivers = accountContext.getClientsReceivers(null, this.namespace);
		
		sys.log("2.AccountsManager[sendRemoteActionByAccountId]: " + (receivers ? receivers.length : "NULL"));
		
		if (receivers.length > 0)
			this.sendAction({
				xtype: "PROCESS_ACTION",
				data: {
					name: name,
					data: data
				}, 
				receivers: receivers
			});
	}
};

AccountsManager.prototype.sendRemoteActionBySessionIdToClient = function(client, name, data)
{
	var accountContext = client.data.accountContext;
	var receiver = accountContext.getClientReceiver(client, this.namespace);
	
	sys.log("1.AccountsManager[sendRemoteActionBySessionIdToClient]: " + receiver);
	
	if (receiver)
		this.sendAction({
			xtype: "PROCESS_ACTION",
			data: {
				name: name,
				data: data
			}, 
			receiver: receiver
		});
}; 