// require('dotenv').load();

var express = require('express');
var app = express();
var port = process.env.PORT || 3000;

var cors = require('cors');
var fs = require('fs');
var fileUpload = require('express-fileupload');

var router = express.Router();

var Controller = require('./app/controller');
var app_controller = new Controller(__dirname);

var app_router = require('./app/router')(router, app_controller);

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(cors());
app.use(fileUpload());
app.use(router);

var server = app.listen(port, function() {
	console.log('Express server listening on port ' + port);
});

// var bodyParser = require('body-parser');
// router.use(bodyParser.urlencoded({ extended: true }));

/*

var MongoClient = require('mongodb').MongoClient,
assert = require('assert');
var url = process.env.MONGO_URL;

MongoClient.connect(url, function(err, db) {

	// TODO stuff

});

function sample(array) {
	return array[parseInt(Math.random()*array.length)];
}

function shuffle(array) {
	var res = array.slice(), rnd, aux;
	for(var i = 0; i < res.length; i++) {
		rnd = parseInt(Math.random()*res.length);
		aux = res[i];
		res[i] = res[rnd];
		res[rnd] = aux;
	}
	return res;
}

*/