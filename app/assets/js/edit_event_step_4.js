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
					characters = event.characters;
					console.log(template);
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

			$("#btn-save").on("click", function() {

				buildJSON();

			});

			$("#btn-preview").on("click", function() {

				preview();

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
		setChecked($("#winner_border_opacity"), template.winner.border_opacity);
		$("#runnerup_text_color").val(template.runnerup.text_color);
		$("#runnerup_border_color").val(template.runnerup.border_color);
		setChecked($("#runnerup_border_opacity"), template.runnerup.border_opacity);
		$("#third_text_color").val(template.third.text_color);
		$("#third_border_color").val(template.third.border_color);
		setChecked($("#third_border_opacity"), template.third.border_opacity);
		$("#rest_text_color").val(template.rest.text_color);
		$("#rest_border_color").val(template.rest.border_color);
		setChecked($("#rest_border_opacity"), template.rest.border_opacity);
		$("#row_text_color").val(template.row.text_color);
		$("#row_border_color").val(template.row.border_color);
		setChecked($("#row_border_opacity"), template.row.border_opacity);
		$("#background_color").val(template.background.color);
		if(event.template.background.link) $("#background_picture").attr("src", event.template.background.link);
		else $("#background_picture").removeAttr("src");
	}

	function buildJSON() {
		console.log("Template:");
		console.log(template);
		var result = {
			title: $("#title").val(),
			number_columns: $("#number_columns").val(),
			number_characters: $("#number_characters").val(),
			winner: {
				text_color: $('#winner_text_color').val(),
				border_color: $('#winner_border_color').val(),
				border_opacity: isChecked($('#winner_border_opacity'))
			},
			runnerup: {
				text_color: $('#runnerup_text_color').val(),
				border_color: $('#runnerup_border_color').val(),
				border_opacity: isChecked($('#runnerup_border_opacity'))
			},
			third: {
				text_color: $('#third_text_color').val(),
				border_color: $('#third_border_color').val(),
				border_opacity: isChecked($('#third_border_opacity'))	
			},
			rest: {
				text_color: $('#rest_text_color').val(),
				border_color: $('#rest_border_color').val(),
				border_opacity: isChecked($('#rest_border_opacity'))	
			},
			background: {
				color: $("#background_color").val(),
				link: template.background.link
			},
			row: {
				border_color: $('#row_border_color').val(),
				border_opacity: isChecked($('#row_border_opacity'))
			}
		};
		console.log("Result:");
		console.log(result);

		template = result;
	}

	function isChecked($item) {
		return $item.is(":checked");
	}

	function setChecked($item, value) {
		if(value) $item.attr("checked", true);
		else $item.attr("checked", false);
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

		$(".preview-scores").html("");

		template.number_columns = Math.min(template.number_columns, 4);

		var $preview = $(".preview-body");
		var shuffled_characters = shuffle(characters);

		console.log(template.background.color);

		if(template.background.link) $preview.css("background", "url(" + template.background.link + ")")
		else $preview.css("background-color", template.background.color);

		$(".preview-title").html(template.title);

		var column_width = 48;
		column_width = parseInt(50/template.number_columns);
		column_width += "%";

		var number_characters = Math.min(template.number_characters, characters.length);
		var columns = [];

		for(var i = 0; i < template.number_columns; i++) {
			columns.push([]);
		}
		var i = 0;
		while(shuffled_characters.length > 0) {
			columns[i].push(shuffled_characters.shift());
			i = (i+1)%template.number_columns;
		}

		for(var i = 0; i < template.number_columns; i++) {
			$(".preview-scores").append("<div class='preview-column' id='preview-column-" + i + "'></div>");
			for(var j = 0; j < columns[i].length; j++) {
				$("#preview-column-" + i).append("<div class='preview-character'><img class='preview-image' src='" + 
					columns[i][j].img + "'>" + columns[i][j].name + "</div>");
			}
		}

		$(".preview-column").css("width", column_width);

	}

})(jQuery);