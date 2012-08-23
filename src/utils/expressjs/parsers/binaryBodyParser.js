exports.binaryBodyParser = function(){
	
	var parsers = {
	  'application/octet-stream': function(data) {
		  return new Buffer(data, 'binary');
	  }
	};
	
	var getMime = function(req) {
	  var str = req.headers['content-type'] || '';
	  return str.split(';')[0];
	};
	
  return function bodyParser2(req, res, next) {
	  
    if ('GET' == req.method || 'HEAD' == req.method) return next();
    var parser = parsers[getMime(req)];
    
    if (parser && !req.body) {
      var data = '';
      req.setEncoding('binary');
      req.on('data', function(chunk) { data += chunk; });
      req.on('end', function(){
        req.rawBody = data;
        try {
          req.bodyBuffer = data
            ? parser(data)
            : new Buffer();
        } catch (err) {
          return next(err);
        }
        next();
      });
    } else {
      next();
    }
  };
};