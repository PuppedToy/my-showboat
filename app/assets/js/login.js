(function($) {

	var ticket, active_button = true;

	$(document).ready(function() {
		$(".login-input").on("keyup", function(e) {
			if(e.which === 13) login();
		});

		$(".signup-input").on("keyup", function(e) {
			if(e.which === 13) signup();
		});

		$("#tab-login").on("click", function() {
			$("#log_name").val($("#sign_name").val());
			$("#log_password").val($("#sign_password").val());
			$("#tab-signup").removeClass("tab-selected");
			$("#tab-login").addClass("tab-selected");
			$(".login").show();
			$(".signup").hide();
		});

		$("#tab-signup").on("click", function() {
			$("#sign_name").val($("#log_name").val());
			$("#sign_password").val($("#log_password").val());
			$("#sign_repeat_password").val("");
			$("#tab-login").removeClass("tab-selected");
			$("#tab-signup").addClass("tab-selected");
			$(".login").hide();
			$(".signup").show();
		});

		$("#login-btn").on("click", function() {

			login();
			
		});
		$("#signup-btn").on("click", function() {
			
			signup();

		});
	});

	function login() {
		if(!active_button) return;
		active_button = false;
		$.ajax({
			type: "POST",
			url: "/api/login",
			data: JSON.stringify({ name: $("#log_name").val(), password: $("#log_password").val() }),
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			success: function(response){
				ticket = response.ticket;
				Cookies.set('ticket', ticket, {expires: 1});
				alert("Congrats! You logged in. Your ticket is " + ticket);
				// TODO location href
			},
			error: function(response) {
				if(response.status == 404 || response.status == 401) {
					$(".error").html("User or password incorrect");
				} else if(response.status == 500) {
					$(".error").html("Server internal error. Please contact the administrator or try it later");
				} else {
					$(".error").html(response.responseText);
				}
				$(".error").slideDown();
				active_button = true;
			}
		});
	}

	function signup() {
		if(!active_button) return;
		active_button = false;
		if($("#sign_password").val() !== $("#sign_repeat_password").val()) {
			$(".error").html("Passwords do not match. Please type it again");
			$(".error").slideDown();
			return;
		}

		var data = {
			name: $("#sign_name").val(),
			password: $("#sign_password").val()
		};

		if($("#sign_email").val()) data.email = $("#sign_email").val();

		$.ajax({
			type: "POST",
			url: "/api/users",
			data: JSON.stringify(data),
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			success: function(response){
				ticket = response.ticket;
				Cookies.set('ticket', ticket, {expires: 1});
				alert("Congrats! You signed up. Your ticket is " + ticket);
				// TODO location href
			},
			error: function(response) {
				if(response.status == 500) {
					$(".error").html("Server internal error. Please contact the administrator or try it later");
				} else {
					$(".error").html(response.responseText);
				}
				$(".error").slideDown();
				active_button = true;
			}
		});
	}

})(jQuery);