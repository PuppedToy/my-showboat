(function($) {

	var ticket;

	$(document).ready(function() {

		$(document).ready(function() {
			checkConnection(function() {
				ticket = Cookies.get("ticket");
				setupLogout();

				$("#create").off("click");
				$("#create").on("click", function() {
					window.location.href = "/event_list";
				});
			});
		});

	
		$("#create").on("click", function() {
			window.location.href = "/login";
		});

	});

})(jQuery);