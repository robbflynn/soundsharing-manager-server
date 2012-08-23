require('./src/utils/Math.uuid');

var config = require('./src/config/config');

var net = require("net");
var sys = require('sys');

var express = require('express');
var mongodm = require("mongodm");

var flashsocket = require('flashsocket');

var ServerMessageRouter = flashsocket.ServerMessageRouter;
var binaryBodyParser = require('./src/utils/expressjs/parsers/binaryBodyParser.js').binaryBodyParser;

var ManagerServer = require('./src/soundshare/ManagerServer');
var ManagerContext = require('./src/soundshare/data/ManagerContext.js');

// *********

var context = new ManagerContext();
var netserver;

//*********

function init()
{
	// Express

	var rest = express.createServer();

	rest.configure(function(){
		rest.use(express.bodyParser());
		rest.use(binaryBodyParser());
		rest.use(express.methodOverride());
		rest.use(rest.router);
	  });

	rest.listen(config.express.port, config.express.address);

	context.rest = rest;
	
	sys.log('[Express(address="' + config.express.address + '", port="' + config.express.port + '")]');
	
	// Socket
	
	var socket = flashsocket.createServerBase(config.server.url);
	socket.start(config.socket.port, config.socket.address);
	var managerServer = new ManagerServer(context);

	socket.router.addUnit(managerServer);

	context.socket = socket;
	context.socket.router = socket.router;
	context.config = config;
	 
	// ******************************************************************************************************
	// crossdomain.xml
	// ******************************************************************************************************

	netserver = net.createServer(function(socket){
			
		socket.addListener("error",function(err){
			socket.end && socket.end() || socket.destroy && socket.destroy();
		});

		var xml = '<?xml version="1.0"?>\n<!DOCTYPE cross-domain-policy SYSTEM \n"http://www.adobe.com/xml/dtds/cross-domain-policy.dtd">\n<cross-domain-policy>\n';
		xml += '<site-control permitted-cross-domain-policies="all"/>\n';
		xml += '<allow-access-from domain="*" to-ports="*"/>\n';
		xml += '</cross-domain-policy>\n';
		
		if(socket && socket.readyState == 'open'){
		  socket.write(xml);
		  socket.end();	

		}
	});

	netserver.addListener("error",function(err){}); 
	netserver.listen(7843, '0.0.0.0');
}

// *********

sys.log('--------------------------------------------------------------------------------------------------------');
sys.log('[Server(url="' + config.server.url + '")]');
sys.log('--------------------------------------------------------------------------------------------------------');

mongodm.withDatabase(config.mongodb.dbname, config.mongodb.address, config.mongodb.port, function(err, dbfacade) {
	if (!err)
	{
		context.dbfacade = dbfacade;
		sys.log('[MongoDB(address="' + config.mongodb.address + '", port="' + config.mongodb.port + '")]');
		
		init();
	}
	else
		sys.log("Error connecting MongoDB: " + err);
});

