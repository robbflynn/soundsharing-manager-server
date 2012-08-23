var sys = require('sys');
var fs = require('fs');

var SecureMongoDBManager = require('../../db/SecureMongoDBManager');

PlaylistsDataManager = module.exports = function(context)
{
	SecureMongoDBManager.call(this, context, "playlists");
	
	this.init();
	this.playlistsPath = "./data/";
	
	var _self = this;
	
	this.defineMethod('/save/:id/:total/:sessionId', function(req, res){
	    _self.executeSavePlaylistFile(req, res);
	});
	
	this.defineMethod('/load/:id', function(req, res){
	    _self.executeLoadPlaylistFile(req, res);
	});
	
	this.insetActionName = "PLAYLIST_INSERTED";
	this.updateActionName = "PLAYLIST_UPDATED";
	this.deleteActionName = "PLAYLIST_DELETED";
};

PlaylistsDataManager.prototype = new SecureMongoDBManager();
PlaylistsDataManager.prototype.executeSavePlaylistFile = function(req, res)
{
	var id = req.param("id");
	var total = req.param("total");
	var sessionId = req.param("sessionId");
	var filename = this.playlistsPath + id + ".pl";
	
	var _self = this;
		
	sys.log("1.-PlaylistsDataManager[executeSavePlaylistFile]- " + id + ":" + total);
	
	fs.writeFile(filename, req.bodyBuffer, function (err) {
		if (err) 
			res.send({error: "Error", code: 0});
		else
		  	_self.context.dbfacade.withCollection(_self.collection).update({_id: id}, {$set: {"total": total}}, function(err) {
				if (err)
				{
					fs.unlink(filename);
					res.send({error: "Error", code: 0});
				}
				else
				{
					_self.context.accountsManager.sendRemoteActionBySessionId(sessionId, _self.updateActionName, {_id: id, total: total});
					res.send({data: true});
				}
			});
	});
};

PlaylistsDataManager.prototype.executeLoadPlaylistFile = function(req, res)
{
	var id = req.param("id");
	
	sys.log("1.-PlaylistsDataManager[executeLoadPlaylistFile]- " + id);
	
	this.loadPlaylistFile(id, 
		function(data) {
			res.send(data);
		}, 
		function() {
			res.send({error: "Error", code: 0});
		}
	);
};

PlaylistsDataManager.prototype.loadPlaylistFile = function(id, complete, error)
{
	var filename = this.playlistsPath + id + ".pl";
	
	sys.log("1.-PlaylistsDataManager[loadPlaylistFile]- " + filename);
	
	fs.readFile(filename, function (err, data) {
		if (err)
			error();
		else
			complete(data);
	});
};