var sys = require('sys');

var FlashSocketMessage = require('flashsocket').FlashSocketMessage;

SecureServerActionMessageBuilder = module.exports = function(target)
{
	this.target = target;
	
	this.message = new FlashSocketMessage();
	this.messageHeader = {
		route: {
			sender: null,
			receiver: null
		},
		data: {
			token: null
		}
	};
};

SecureServerActionMessageBuilder.prototype.build = function(action, body, token, receiverRoute)
{
	if (!action && !action.xtype)
		throw new Error("invalid action!");
	
	this.messageHeader.route.sender = this.target.route;
	this.messageHeader.route.receiver = receiverRoute ? receiverRoute : this.target.receiverRoute;
	
	this.messageHeader.data.token = token;
	this.messageHeader.data.action = action;
	
	this.message.setJSONHeader(this.messageHeader);
	
	if (body)
		this.message.setBody(body);
	
	return this.message;
};