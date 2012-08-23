var sys = require('sys');

var SecureMongoDBManager = require('../../db/SecureMongoDBManager');
var finderBuilder = require('../../../utils/mongodb/MongoDeepFinder').builder;

MembersDataManager = module.exports = function(context)
{
	SecureMongoDBManager.call(this, context, "members");
	
	var _self = this;
	
	this.defineMethod('/:accountId/:page/:itemsPerPage', function(req, res){
	    _self.executeMembers(req, res);
	});
};


MembersDataManager.prototype = new SecureMongoDBManager();
MembersDataManager.prototype.executeMembers = function(req, res)
{
	var _self = this;
	var accountId = req.param("accountId");
	var page = req.param("page");
	var itemsPerPage = req.param("itemsPerPage");
	
	sys.log("1.-MembersDataManager[executeMembers]-" + accountId + " : " + page + " : " + itemsPerPage);
	
	this.getMembersList(accountId, page, itemsPerPage, function(err, data) {
		if (!err)
			res.send({data: data});
		else
			res.send({error: "Error", code: 0});
	});
};


MembersDataManager.prototype.getMembersList = function(accountId, page, itemsPerPage, result)
{
	var _self = this;
	
	sys.log("1.-MembersDataManager[getMembersList]-" + accountId + " : " + page + " : " + itemsPerPage);
	
	this.context.dbfacade.withCollection("members").count({accountId: accountId}, function(err, total) {
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
				
				sys.log("2.-MembersDataManager[getMembersList]-" + page + " : " + pages + " : " + total);
				
				var setting = {
						findFn: function(doc, result) {
							_self.context.dbfacade.withCollection("members")
									.synch(true)
									.find({accountId: accountId}, result)
									.skip((page - 1) * itemsPerPage)
									.limit(itemsPerPage)
									.end();
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
					};
				
				var finer = finderBuilder();
				
				finer(setting, function(err, collection) {
					
					sys.log("3.-MembersDataManager[getMembersList]-" + err + " : " + collection);
					
					if (!err)
						result(null, {
							collection: collection,
							page: page,
							pages: pages,
							total: total
						});
					else
						result(err);
				});
			}
			else
				result(null, {
					collection: [],
					page: 1,
					pages: 1,
					total: 0
				});
		}
		else
			result({error: "Error", code: 0});
	});
};