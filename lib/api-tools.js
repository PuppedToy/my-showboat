module.exports = {

	validate_email: function(email) {
	    var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	    return regex.test(email.toLowerCase());
	},

	get_base_uri: function(request) {
		return request.protocol + '://' + request.get('host');
	},

	get_full_uri: function(request) {
		return request.protocol + '://' + request.get('host') + request.originalUrl;
	},

	sample: function(array) {
		return array[parseInt(Math.random()*array.length)];
	}

}