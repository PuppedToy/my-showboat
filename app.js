// require('dotenv').load();

// TODO Comment this code and reestructure it

var express = require('express');
var app = express();
var port = process.env.PORT || 3000;

var cors = require('cors');
var fs = require('fs');
var fileUpload = require('express-fileupload');

var router = express.Router();

// TODO Think about move this to lib
var vote_factory = require('./lib/vote_factory');

var Controller = require('./app/controller');
var app_controller = new Controller(__dirname, vote_factory);

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

var vote_app = require('./app/vote_app')(server, vote_factory);