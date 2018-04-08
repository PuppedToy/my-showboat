(function($) {

	var ticket, current_event, user_id, characters, selected_character, event, template, presaves = [{}, {}];

	$(document).ready(function() {
		checkConnection(function(response) {
			ticket = Cookies.get("ticket");
			setupLogout();
			user_id = response.id;

			current_event = Cookies.get("current_event");
			if(current_event === undefined) window.location.href = "/event_list";

			$.ajax({
				type: "POST",
				url: "/api/users/" + user_id + "/events/" + current_event,
				data: JSON.stringify({ ticket: ticket }),
				contentType: "application/json; charset=utf-8",
				dataType: "json",
				success: function(response){
				
					event = response;
					template = event.template;
					applyTemplate();

				},
				error: function(response) {
					if(response.status == 401) {
						// unauthorized
						alert("Connection lost. Please, log in again");
						disconnect();
					} else if(response.status == 500) {
						alert("Internal server error. Please, contact the adminsitrator or try it later");
						disconnect();
					}
				}
			});

			$("#prev_arrow").on("click", function() {
				window.location.href = "/edit_event?step=3";
			});

			$("#uploadedFile").on("change", function() {

				if(!$(".file_selector").val()) {
					return;
				}

				$("#background_picture").attr("src", "/assets/images/loading.gif");

				var form = $('form')[0];
				var formData = new FormData(form);

				formData.append('ticket', ticket);

				$.ajax({
				    url: "/api/users/" + user_id + "/events/" + current_event + "/template_images",
				    data: formData,
				    type: 'POST',
				    contentType: false,
				    processData: false,
				    success: function(response) {
						event = response;
						if(event.template.background.link) $("#background_picture").attr("src", event.template.background.link);
						else $("#background_picture").removeAttr("src");
				    },
				    error: function(response) {
				    	if(response.status == 401) {
							// unauthorized
							alert("Connection lost. Please, log in again");
						} else if (response.status == 500) {
							alert("Internal server error. Please, contact the adminsitrator or try it later");
						} else if (response.status == 400) {
							alert("Bad request from the browser. Please, contact the admin.");
						} else {
							alert("Unknown error " + response.status);
						}
						disconnect();
				    }
				});
			});

			$("#extLinkButton").on("click", function() {
				
				$("#background_picture").attr("src", "/assets/images/loading.gif");

				$.ajax({
				    url: "/api/users/" + user_id + "/events/" + current_event + "/template_link_images",
				    data: JSON.stringify({ 
				    	ticket: ticket, 
				    	new_link: $("#extLinkInput").val()
    	  			}),
				    type: 'POST',
					contentType: "application/json; charset=utf-8",
					dataType: "json",
				    success: function(response) {
						event = response;
						if(event.template.background.link) $("#background_picture").attr("src", event.template.background.link);
						else $("#background_picture").removeAttr("src");
				    },
				    error: function(response) {
				    	if(response.status == 401) {
							// unauthorized
							alert("Connection lost. Please, log in again");
						} else if (response.status == 500) {
							alert("Internal server error. Please, contact the adminsitrator or try it later");
						} else if (response.status == 400) {
							alert("Bad request from the browser. Please, contact the admin.");
						} else {
							alert("Unknown error " + response.status);
						}
						disconnect();
				    }
				});
			});

			$("#removeImageButton").on("click", function() {

				$("#background_picture").attr("src", "");

				$.ajax({
				    url: "/api/users/" + user_id + "/events/" + current_event + "/template_images",
				    data: JSON.stringify({ 
				    	ticket: ticket
				    }),
				    type: 'DELETE',
					contentType: "application/json; charset=utf-8",
					dataType: "json",
				    success: function(response) {
						event = response;
						if(event.template.background.link) $("#background_picture").attr("src", event.template.background.link);
						else $("#background_picture").removeAttr("src");
				    },
				    error: function(response) {
				    	if(response.status == 401) {
							// unauthorized
							alert("Connection lost. Please, log in again");
						} else if (response.status == 500) {
							alert("Internal server error. Please, contact the adminsitrator or try it later");
						} else if (response.status == 400) {
							alert("Bad request from the browser. Please, contact the admin.");
						} else {
							alert("Unknown error " + response.status);
						}
						disconnect();
				    }
				});

			});

		}, function() {
			disconnect();
		});
	});

	function applyTemplate() {
		$("#title").val(template.title);
		$("#number_columns").val(template.number_columns);
		$("#number_characters").val(template.number_characters);
		$("#winner_text_color").val(template.winner.text_color);
		$("#winner_border_color").val(template.winner.border_color);
		$("#winner_border_opacity").val(template.winner.border_opacity);
		$("#runnerup_text_color").val(template.runnerup.text_color);
		$("#runnerup_border_color").val(template.runnerup.border_color);
		$("#runnerup_border_opacity").val(template.runnerup.border_opacity);
		$("#third_text_color").val(template.third.text_color);
		$("#third_border_color").val(template.third.border_color);
		$("#third_border_opacity").val(template.third.border_opacity);
		$("#rest_text_color").val(template.rest.text_color);
		$("#rest_border_color").val(template.rest.border_color);
		$("#rest_border_opacity").val(template.rest.border_opacity);
		$("#bg-select-1").val(template.background.type);
		$("#bg-select-2").val(template.row.background.type);
		if(event.template.background.link) $("#background_picture").attr("src", event.template.background.link);
		else $("#background_picture").removeAttr("src");
	}

	function buildJSON() {
		var result = {
			title: $("#title").val(),
			number_columns: $("#number_columns").val(),
			number_characters: $("#number_characters").val(),
			winner: {
				text_color: $('#winner_text_color').val(),
				border_color: $('#winner_border_color').val(),
				border_opacity: $('#winner_border_opacity').val()	
			},
			runnerup: {
				text_color: $('#runnerup_text_color').val(),
				border_color: $('#runnerup_border_color').val(),
				border_opacity: $('#runnerup_border_opacity').val()
			},
			third: {
				text_color: $('#third_text_color').val(),
				border_color: $('#third_border_color').val(),
				border_opacity: $('#third_border_opacity').val()	
			},
			rest: {
				text_color: $('#rest_text_color').val(),
				border_color: $('#rest_border_color').val(),
				border_opacity: $('#rest_border_opacity').val()	
			},
			background: {
				color: $("#background_color").val(),
				link: event.template.link,
			},
			row: {
				border_color: $('#row_border_color').val(),
				border_opacity: $('#row_border_opacity').val(),
			}
		};
	}

	function error(msg) {
		if($(".success").css("display") != "none") $(".success").slideUp();
		$(".error").html(msg);
		$(".error").slideDown();
	}

	function success(msg) {
		if($(".error").css("display") != "none") $(".error").slideUp();
		$(".success").html(msg);
		$(".success").slideDown();
	}

	function preview() {

		

	}

})(jQuery);