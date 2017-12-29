(function($) {

	$(document).ready(function() {
		$("#create").click(function() {
			var getUrl = window.location;
			window.location.href = getUrl.protocol + "//" + getUrl.host + "/login" ;
		});
	});

})(jQuery);