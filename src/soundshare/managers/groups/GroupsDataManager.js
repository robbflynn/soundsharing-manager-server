var sys = require('sys');

var SecureMongoDBManager = require('../../db/SecureMongoDBManager');
var finderBuilder = require('../../../utils/mongodb/MongoDeepFinder').builder;

GroupsDataManager = module.exports = function(context)
{
	SecureMongoDBManager.call(this, context, "groups");
	
	this.init();
	
	var _self = this;
	
	this.defineMethod('/join/:notificationId', function(req, res){
	    _self.executeJoinToGroup(req, res);
	});
	
	this.defineMethod('/leave/:notificationId', function(req, res){
	    _self.executeLeaveGroup(req, res);
	});
	
	this.defineMethod('/members/:groupId/:page/:itemsPerPage', function(req, res){
	    _self.executeMembers(req, res);
	});
	
	this.insetActionName = "GROUP_INSERTED";
	this.updateActionName = "GROUP_UPDATED";
	this.deleteActionName = "GROUP_DELETED";
};

GroupsDataManager.prototype = new SecureMongoDBManager();
GroupsDataManager.prototype.executeMembers = function(req, res)
{
	var _self = this;
	var groupId = req.param("groupId");
	var page = req.param("page");
	var itemsPerPage = req.param("itemsPerPage");
	
	sys.log("1.-GroupsDataManager[executeMembers]-" + groupId + " : " + page + " : " + itemsPerPage);
	
	this.context.dbfacade.withCollection("groups_members").count({groupId: groupId}, function(err, total) {
		if (!err)
		{
			if (total > 0)
			{
				var pages = Math.ceil(total / itemsPerPage);
				
				if (page < 1)
					page = 1;
				else
				if (page > pages)
					page = pages;
				
				sys.log("2.-GroupsDataManager[executeMembers]-" + page + " : " + pages + " : " + total);
				
				
				
				var setting = {
						findFn: function(doc, result) {
							_self.context.dbfacade.withCollection("groups_members")
									.synch(true)
									.find({groupId: groupId}, result)
									.skip((page - 1) * itemsPerPage)
									.limit(itemsPerPage)
									.end();
						},
						settings: [
						    {
						    	name: "member",
								findOneFn: function(doc, result) {
									_self.context.dbfacade.withCollection("members").findOne({_id: doc.memberId}, result);
								},
								settings: [
								    {
										findOneFn: function(doc, result) {
											_self.context.dbfacade.withCollection("accounts").findOne({_id: doc.memberId}, result);
										},
										result: function(parent, obj) {
											parent["memberName"] = obj.username;
										}
								    }
								]
						    }
						]
					};
				
				var groupsMembersFinder = finderBuilder();
				
				groupsMembersFinder(setting, function(err, collection) {
					
					sys.log("3.-GroupsDataManager[executeMembers]-" + err + " : " + collection);
					
					if (!err)
						res.send({
							data: {
								collection: collection,
								page: page,
								pages: pages,
								total: total
							}
						});
					else
						res.send({error: "Error", code: 0});
				});
			}
			else
				res.send({
					data: {
						collection: [],
						page: 1,
						pages: 1,
						total: 0
					}
				});
		}
		else
			res.send({error: "Error", code: 0});
	});
};

GroupsDataManager.prototype.executeJoinToGroup = function(req, res)
{
	var _self = this;
	var notificationId = req.param("notificationId");
	var obj = req.body;
	
	sys.log("1.-GroupsDataManager[executeJoinToGroup]- " + notificationId);
	
	this.context.dbfacade.withCollection("notifications").findOne({_id: notificationId}, function(err, ndoc) {
		if (!err && ndoc)
		{
			sys.log("NotificationData:\n" + sys.inspect(ndoc));
			
			_self.context.dbfacade.withCollection("members").findOne({accountId: ndoc.receiverId, memberId: ndoc.senderId}, function(err, mdoc) {
				if (err)
					res.send({error: "Error", code: 0});
				else
				if (mdoc)
					_self.context.dbfacade.withCollection("groups_members").findOne({groupId: ndoc.groupId, memberId: mdoc.memberId}, function(err, gmdoc) {
						if (err)
							res.send({error: "Error", code: 0});
						else
						if (gmdoc)
							res.send({error: "Group member already exist!", code: 0});
						else
						{
							var groupMemeber = {
									_id: Math.uuidCompact(),
									accountId: ndoc.receiverId,
									memberId: mdoc._id,
									groupId: ndoc.groupId
								};
						
							_self.context.dbfacade.withCollection("groups_members").insert(groupMemeber, function(err, gmdocs) {
								if (!err && gmdocs)
								{
									_self.context.dbfacade.withCollection("notifications").remove({_id: notificationId});
									
									res.send({
										data: {
											groupMember: groupMemeber
										}
									});
								}
								else
									res.send({error: "Error", code: 0});
							});
						}
					});
				else
				{
					var memeber = {
							_id: Math.uuidCompact(),
							accountId: ndoc.receiverId,
							memberId: ndoc.senderId
						};
					
					_self.context.dbfacade.withCollection("members").insert(memeber, function(err, mdocs) {
						if (!err && mdocs)
						{
							sys.log("MemberData:\n" + sys.inspect(mdocs));
							
							_self.context.dbfacade.withCollection("groups_members").findOne({memberId: memeber.memberId, groupId: ndoc.groupId}, function(err, gmdoc) {
								if (err)
									res.send({error: "Error", code: 0});
								else
								if (gmdoc)
									res.send({error: "Group member already exist!", code: 0});
								else
								{
									
									var groupMemeber = {
											_id: Math.uuidCompact(),
											accountId: ndoc.receiverId,
											memberId: memeber._id,
											groupId: ndoc.groupId
										};
								
									_self.context.dbfacade.withCollection("groups_members").insert(groupMemeber, function(err, gmdocs) {
										if (!err && gmdocs)
										{
											_self.context.dbfacade.withCollection("notifications").remove({_id: notificationId});
											
											sys.log("GroupMemberData:\n" + sys.inspect(gmdocs));
											
											res.send({
												data: {
													member: memeber,
													groupMember: groupMemeber
												}
											});
										}
										else
											res.send({error: "Error", code: 0});
									});
								}
							});
						}
						else
							res.send({error: "Error", code: 0});
					});
				}
			});
		}
		else
			res.send({error: "Error", code: 0});
	});
};

GroupsDataManager.prototype.executeLeaveGroup = function(req, res)
{
	var obj = req.body;
	
	sys.log("1.-GroupsDataManager[executeLeaveGroup]- " + sys.inspect(obj));
	
	/*obj._id = Math.uuidCompact();
	
	this.context.dbfacade.withCollection("groups_members").insert(obj, function(err, doc) {
		
		sys.log("2.-GroupsDataManager[executeJoinToGroup]- " + err);
		
		if (!err)
			res.send({data: doc[0]});
		else
			res.send({error: "Error", code: 0});
	});*/
};