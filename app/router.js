module.exports = function (router, controller) {

	/****** Indexing routes ******/
	router.get('/', controller.render_index);
	router.get('/login', controller.render_login);
	router.get('/event_list', controller.render_event_list);
	router.get('/edit_event', controller.render_edit_event);


	/****** API Endpoints ******/
	// Users operations
	router.get('/api/users', controller.get_userlist);
	router.post('/api/users', controller.create_user);
	router.get('/api/users/:userId', controller.get_user);
	router.put('/api/users/:userId', controller.edit_user);
	router.delete('/api/users/:userId', controller.delete_user);
	router.post('/api/login', controller.user_login);
	router.post('/api/logout', controller.user_logout);
	router.post('/api/check_ticket', controller.check_ticket);

	// Events operations (require ticket)
	router.post('/api/users/:userId/events/list', controller.get_eventlist);
	router.post('/api/users/:userId/events', controller.create_event);
	router.post('/api/users/:userId/events/:eventId', controller.get_event);
	router.put('/api/users/:userId/events/:eventId', controller.edit_event);
	router.delete('/api/users/:userId/events/:eventId', controller.delete_event);
	router.post('/api/users/:userId/events/:eventId/logs/list', controller.get_loglist);
	router.post('/api/users/:userId/events/:eventId/logs', controller.create_log);
	router.post('/api/users/:userId/events/:eventId/logs/:logId', controller.get_log);
	router.put('/api/users/:userId/events/:eventId/logs/:logId', controller.edit_log);
	router.delete('/api/users/:userId/events/:eventId/logs/:logId', controller.delete_log);

	// Images operations
	router.post('/api/images', controller.upload_image);

	// Votes operations
	router.get('/api/votes', controller.get_votelist);
	router.post('/api/votes', controller.create_vote);
	router.get('/api/votes/:voteId', controller.get_vote);
	router.put('/api/votes/:voteId', controller.edit_vote);
	router.delete('/api/votes/:voteId', controller.delete_vote);

}