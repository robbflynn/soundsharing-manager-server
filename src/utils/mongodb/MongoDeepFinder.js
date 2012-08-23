var sys = require('sys');

exports.builder = function() {
	return function(settings, result) {
		var total = 0;
		var errors = [];
		
		var $result = function(docs) {
			if (total == 0)
				result(errors.length > 0 ? errors : null, docs);
		};
		
		var $error = function(docs) {
			$result = function(docs) {
				
			};
			result(errors, docs);
		};
		
		var execute = function(parent, settings, root, item) {
			if (settings)
			{
				if (typeof settings.findFn == "function")
				{
					total ++;
					settings.findFn(parent, function(err, collection) {
						if (err)
						{
							errors.push(err);
							
							if (settings.critical)
								$error(root);
						}
						else
						if (collection && settings.settings && settings.settings.length > 0)
							settings.settings.forEach(function(set) {
								collection.forEach(function(cdoc) {
									execute(cdoc, set, root, item);
				                });
			                });
						
						if (settings.result)
							settings.result(parent, collection, err, root, item);
						else
						if (settings.name)
							parent[settings.name] = collection;
						
						total --;
						$result(root);
					});
				}
				else
				if (typeof settings.findOneFn == "function")
				{
					total ++;
					settings.findOneFn(parent, function(err, obj) {
						if (err)
						{
							errors.push(err);
							
							if (settings.critical)
								$error(root);
						}
						else
						if (obj && settings.settings && settings.settings.length > 0)
							settings.settings.forEach(function(set) {
								execute(obj, set, root, item);
			                });
						
						if (settings.result)
							settings.result(parent, obj, err, root, item);
						else
						if (settings.name)
							parent[settings.name] = obj;
						
						total --;
						$result(root);
					});
				}
			}
		};
		
		// *************************************************************************************
		
		if (settings)
		{
			if (typeof settings.findFn == "function")
			{
				total ++;
				settings.findFn(null, function(err, collection) {
					if (err)
					{
						errors.push(err);
						$error(collection);
					}
					else
					{
						if (collection && settings.settings && settings.settings.length > 0)
							settings.settings.forEach(function(set) {
								collection.forEach(function(cdoc) {
									execute(cdoc, set, collection, cdoc);
				                });
			                });
						
						total --;
						$result(collection);
					}
				});
			}
			else
			if (typeof settings.findOneFn == "function")
			{
				total ++;
				settings.findOneFn(null, function(err, obj) {
					if (err)
					{
						errors.push(err);
						$error(obj);
					}
					else
					{
						if (obj && settings.settings && settings.settings.length > 0)
							settings.settings.forEach(function(set) {
								execute(obj, set, obj);
			                });
						
						total --;
						$result(obj);
					}
				});
			}
		}
	};
};



/*var settings = {
findFn: function(doc, result) {
	dbfacade.withCollection("accounts").find({}, result);
},
settings: [
    {
		name: "mygroups",
		findFn: function(doc, result) {
			dbfacade.withCollection("groups").find({accountId: doc.id}, result);
		},
    	settings: [
			{
				name: "shitzzz",
				findFn: function(doc, result) {
					dbfacade.withCollection("groups").find({a: 1}, result);
				}
			}
    	]
    },
    {
    	name: "mygroups2",
		findFn: function(doc, result) {
			dbfacade.withCollection("groups").find({a: 1}, result);
		}
    }
]
};

/*var settings = {
	findFn: function(doc, result) {
		dbfacade.withCollection("accounts").find({}, result);
	},
	settings: [
	    {
	    	name: "group",
	    	critical: true,
			findOneFn: function(doc, result) {
				dbfacade.withCollection("groups").findOne({accountId: doc.id}, result);
			},
			settings: [
			    {
			    	findFn: function(doc, result) {
						dbfacade.withCollection("accounts").find({}, result);
					},
					result: function(obj, docs) {
						obj["SSSSSSSSSSSSSSSSSSSSSSS"] = docs;
					}
			    }
			]
	    }
	]
};

var settings = {
	findOneFn: function(doc, result) {
		dbfacade.withCollection("accounts").findOne({}, result);
	},
	settings: [
	    {
	    	name: "groups",
			findFn: function(doc, result) {
				dbfacade.withCollection("groups").find({accountId: doc.id}, result);
			},
			settings: [
			    {
			    	name: "SHITZZZZZ",
			    	findFn: function(doc, result) {
						dbfacade.withCollection("accounts").find({}, result);
					}
			    }
			]
	    }
	]
};*/