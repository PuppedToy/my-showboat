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

				$("#vote").off("click");
				$("#vote").on("click", function() {
					window.location.href = "/vote";
				});
			});
		});

	
		$("#create").on("click", function() {
			window.location.href = "/login";
		});

		$("#vote").on("click", function() {
			window.location.href = "/vote";
		});

	});

})(jQuery);