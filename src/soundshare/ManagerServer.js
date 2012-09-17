var sys = require('sys');
var events = require('events');

var flashsocket = require('flashsocket-js');

var ServerEventDispatcher = flashsocket.ServerEventDispatcher;
var FlashSocketMessage = flashsocket.FlashSocketMessage;

var SecurityManager = require('./managers/security/SecurityManager');
var AccountsManager = require('./managers/accounts/AccountsManager');
var AccountsDataManager = require('./managers/accounts/AccountsDataManager');
var ConnectionsManager = require('./managers/connections/ConnectionsManager')
;
var ServersManager = require('./managers/servers/ServersManager');
var ServersDataManager = require('./managers/servers/ServersDataManager');

var StationsManager = require('./managers/stations/StationsManager');
var StationsDataManager = require('./managers/stations/StationsDataManager');

var BroadcastsManager = require('./managers/broadcasts/BroadcastsManager');
var PlaylistsDataManager = require('./managers/playlists/PlaylistsDataManager');

var ChannelsManager = require('./managers/channels/ChannelsManager');
var ChannelsDataManager = require('./managers/channels/ChannelsDataManager');

var GroupsDataManager = require('./managers/groups/GroupsDataManager');
var MembersDataManager = require('./managers/members/MembersDataManager');
var NotificationsDataManager = require('./managers/notifications/NotificationsDataManager');

ManagerServer = module.exports = function(context)
{
	ServerEventDispatcher.call(this);
	
	this.setId("MANAGER_SERVER_UNIT");
	this.context = context;
	
	sys.log('"[ManagerServer(id="' + this.id + '")] ');
	
	// Security Manager
	
	this.securityManager = new SecurityManager();
	this.context.securityManager = this.securityManager;
	
	// Accounts Managers
	
	this.accountsManager = new AccountsManager(this.context);
	this.accountsManager.namespace = "socket.managers.AccountsManager";
	
	this.addUnit(this.accountsManager);
	
	this.context.accountsManager = this.accountsManager;
	
	this.accountsDataManager = new AccountsDataManager(this.context);
	this.context.accountsDataManager = this.accountsDataManager;
	
	// Playlists Data Managers
	
	this.playlistsDataManager = new PlaylistsDataManager(this.context);
	this.context.playlistsDataManager = this.playlistsDataManager;
	
	// Channels Data Manager
	
	this.channelsDataManager = new ChannelsDataManager(this.context);
	this.context.channelsDataManager = this.channelsDataManager;
	
	this.channelsManager = new ChannelsManager(this.context);
	this.channelsManager.namespace = "socket.managers.ChannelsManager";
	this.addUnit(this.channelsManager);
	
	this.context.channelsManager = this.channelsManager;
	
	// Broadcasts Manager
	
	this.broadcastsManager = new BroadcastsManager(this.context);
	this.broadcastsManager.namespace = "socket.managers.BroadcastsManager";
	this.addUnit(this.broadcastsManager);
	
	this.context.broadcastsManager = this.broadcastsManager;
	
	// Notifications Manager
	
	this.notificationsDataManager = new NotificationsDataManager(this.context);
	this.context.notificationsDataManager = this.notificationsDataManager;
	
	// Groups Data Manager
	
	this.groupsDataManager = new GroupsDataManager(this.context);
	this.context.groupsDataManager = this.groupsDataManager;
	
	// Members Data Manager
	
	this.membersDataManager = new MembersDataManager(this.context);
	this.context.membersDataManager = this.membersDataManager;
	
	// Servers Data Manager
	
	this.serversManager = new ServersManager(this.context);
	this.serversManager.namespace = "socket.managers.ServersManager";
	
	this.addUnit(this.serversManager);
	
	this.context.serversManager = this.serversManager;
	
	this.serversDataManager = new ServersDataManager(this.context);
	this.context.serversDataManager = this.serversDataManager;
	
	// Stations Data Manager
	
	this.stationsManager = new StationsManager(this.context);
	this.stationsManager.namespace = "socket.managers.StationsManager";
	
	this.addUnit(this.stationsManager);
	
	this.context.stationsManager = this.stationsManager;
	
	this.stationsDataManager = new StationsDataManager(this.context);
	this.context.stationsDataManager = this.stationsDataManager;
	
	// Connections Manager
	// It should be last added manager
	
	this.connectionsManager = new ConnectionsManager(this.context);
	this.connectionsManager.namespace = "socket.managers.ConnectionsManager";
	
	this.addUnit(this.connectionsManager);
	
	this.context.connectionsManager = this.connectionsManager;
};

ManagerServer.prototype = new ServerEventDispatcher();
ManagerServer.prototype.process = function(client, message) 
{
	if (this.accountsDataManager.validate(client, message) || this.serversManager.validate(client, message))
		ServerEventDispatcher.prototype.process.call(this, client, message);
};