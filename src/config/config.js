module.exports = {
	server: {
		url: "192.168.1.161:7000",
		address: "192.168.1.161"
	},
    mongodb: {
    	address: "localhost",
    	port: 27017,
    	dbname: "soundsharedb"
    },
    express: {
        address: "0.0.0.0",
        port: 6001
    },
    socket: {
        address: "0.0.0.0",
        port: 7000
    }
};
