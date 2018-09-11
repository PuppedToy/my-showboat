module.exports = function(express, app, cb) {

	// const cors = require('cors');
	const fileUpload = require('express-fileupload');
	const router = express.Router();

	const Controller = require('./controller');
	const app_controller = new Controller();

	app_controller.getFactories(function(ticket_factory, vote_factory) {

		const app_router = require('./router')(router, app_controller);

		const bodyParser = require('body-parser');
		app.use(bodyParser.json());
		app.use(express.static('public'));
		// app.use(cors());
		app.use(fileUpload());
		app.use(router);

		if(cb) cb(ticket_factory, vote_factory);

	});

}
