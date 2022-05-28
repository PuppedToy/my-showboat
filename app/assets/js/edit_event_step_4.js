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
						template = event.template;
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
						template = event.template;
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
						template = event.template;
						console.log(event);
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

			$("#modalPreview").on("shown.bs.modal", function() {

				preview();

			});

			$("#btn-save").on("click", function() {

				buildJSON(true);

			});

		}, function() {
			disconnect();
		});
	});

	function applyTemplate() {

		var template_categories = ["winner", "runnerup", "third", "present", "rest", "background"];
		template_categories.forEach(function(category) {
			if(!(category in template)) template[category] = {};
		});

		$("#title").val(template.title);
		$("#title_finished").val(template.title_finished);
		$("#time_votes").val(template.time_votes || 4);
		$("#title_color").val(template.title_color);
		$("#number_characters").val(template.number_characters);
		setChecked(
			$("#progress_bar_enabled"), 
			Object.hasOwnProperty.call(template, "progress_bar") ? template.progress_bar.enabled
				: false
		);
		$("#progress_bar_color").val(
			Object.hasOwnProperty.call(template, "progress_bar") ? template.progress_bar.color
			: '#c96d00'
		);
		$("#winner_color").val(template.winner.color);
		setChecked($("#winner_border_opacity"), template.winner.border_opacity);
		$("#runnerup_color").val(template.runnerup.color);
		setChecked($("#runnerup_border_opacity"), template.runnerup.border_opacity);
		$("#third_color").val(template.third.color);
		setChecked($("#third_border_opacity"), template.third.border_opacity);
		$("#present_color").val(template.present.color);
		setChecked($("#present_border_opacity"), template.present.border_opacity);
		$("#rest_color").val(template.rest.color);
		setChecked($("#rest_border_opacity"), template.rest.border_opacity);
		$("#background_color").val(template.background.color);
		if(event.template.background.link) $("#background_picture").attr("src", event.template.background.link);
		else $("#background_picture").removeAttr("src");
		if("type" in template.background) $("#background_" + template.background.type).attr("checked", "checked");
		if("distribution_type" in template) $("#distribution_type_" + template.distribution_type).attr("checked", "checked");

	}

	function buildJSON(save) {
		console.log("Template:");
		console.log(template);
		var result = {
			title: $("#title").val(),
			title_finished: $("#title_finished").val(),
			time_votes: $("#time_votes").val(),
			title_color: $("#title_color").val(),
			distribution_type: $("input:radio[name ='distribution_type']:checked").val(),
			number_columns: $("#number_columns").val(),
			number_characters: $("#number_characters").val(),
			progress_bar: {
				enabled: isChecked($('#progress_bar_enabled')),
				color: $('#progress_bar_color').val(),
			},
			winner: {
				color: $('#winner_color').val(),
				border_opacity: isChecked($('#winner_border_opacity'))
			},
			runnerup: {
				color: $('#runnerup_color').val(),
				border_opacity: isChecked($('#runnerup_border_opacity'))
			},
			third: {
				color: $('#third_color').val(),
				border_opacity: isChecked($('#third_border_opacity'))	
			},
			present: {
				color: $('#present_color').val(),
				border_opacity: isChecked($('#present_border_opacity'))	
			},
			rest: {
				color: $('#rest_color').val(),
				border_opacity: isChecked($('#rest_border_opacity'))	
			},
			background: {
				color: $("#background_color").val(),
				type: $("input:radio[name ='background_type']:checked").val(),
				link: template.background.link
			}
		};
		console.log("Result:");
		console.log(result);

		template = result;

		if(save) {
			$.ajax({
				type: "PUT",
				url: "/api/users/" + user_id + "/events/" + current_event,
				data: JSON.stringify({ ticket: ticket, update: {template: template} }),
				contentType: "application/json; charset=utf-8",
				dataType: "html",
				success: function(response) {
					// OK!
				},
				error: function(response) {
					if(response.status == 401) {
						// unauthorized
						alert("Connection lost. Please, log in again");
					} else {
						alert("Internal server error. Please, contact the adminsitrator or try it later");
					}
					disconnect();
				}
			});
		}

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

		buildJSON(false);

		$(".preview-column").html("");

		var shuffled_characters = characters.slice();
		shuffled_characters.forEach(function(character) {
			character.score = randomInt(0, 200);
		});
		shuffled_characters.sort(function(c1, c2) {
			return c2.score - c1.score;
		});

		var present_character = randomInt(1, shuffled_characters.length);
		var $body = $(".preview-body").first();

		$body.css("background-color", template.background.color);
		if(template.background.link) {
			$body.css("background-image", "url(" + template.background.link + ")");
			if(!("type" in template.background)) template.background.type = "cover";
			console.log(template.background.type);
			switch(template.background.type) {
				case "repeat":
					$body.css("background-repeat", "repeat");
					$body.css("background-size", "auto");
				break;
				case "cover":
					$body.css("background-repeat", "no-repeat");
					$body.css("background-size", "cover");
				break;
				case "contain":
					$body.css("background-repeat", "no-repeat");
					$body.css("background-size", "contain");
				break;
				case "no_repeat":
					$body.css("background-repeat", "no-repeat");
					$body.css("background-size", "100% 100%");
				break;
				default:
				break;
			}
		}
		else $body.css("background-image", "none");
		$(".preview-title").html(template.title);
		$(".preview-title").css("color", template.title_color || "#000");

		var number_characters = Math.min(template.number_characters, characters.length);

		var pos = 1;

		if(template.distribution_type == 'different') {
			for(var i = 0; i < Math.min(number_characters, 3); i++) {
				$("#preview-column-1").append(newPreviewElement(i));
				$(".preview-image").last().css("background-image", "url(" + shuffled_characters[i].img + ")");
			}

			for(var i = 3; i < number_characters; i++) {
				$("#preview-column-2").append(newPreviewElement(i));
				$(".preview-image").last().css("background-image", "url(" + shuffled_characters[i].img + ")");
			}

			$("#preview-column-2").css("padding-top", "30px");

			var rest_height = Math.min(parseInt(95/(number_characters-3)), 18);
			var winner_height = 34;
			var runnerup_height = 30;
			var third_height = 26;
			$(".preview-character").css("height", rest_height + "%");
			$("#preview-character-1").css("height", winner_height + "%");
			$("#preview-character-2").css("height", runnerup_height + "%");
			$("#preview-character-3").css("height", third_height + "%");
		} else {
			$("#preview-column-2").css("padding-top", "0");
			var column = 1;
			for(var i = 0; i < number_characters; i++) {
				if(i >= Math.ceil(number_characters/2)) column = 2;
				$("#preview-column-" + column).append(newPreviewElement(i));
				$(".preview-image").last().css("background-image", "url(" + shuffled_characters[i].img + ")");
			}
			var rest_height = Math.min(parseInt(95/Math.ceil(number_characters/2)), 18);
			$(".preview-character").css("height", rest_height + "%");
		}

		

		$(".preview-character").css("font-size", Math.min(rest_height/3, 3) + "vh");
		$("#preview-character-1").css("font-size", Math.min(winner_height/3, 3) + "vh");
		$("#preview-character-2").css("font-size", Math.min(runnerup_height/3, 3) + "vh");
		$("#preview-character-3").css("font-size", Math.min(third_height/3, 3) + "vh");

		$(".preview-image-box").width($(".preview-image-box").last().height());
		$("#preview-image-box-1").width($("#preview-image-box-1").height());
		$("#preview-image-box-2").width($("#preview-image-box-2").height());
		$("#preview-image-box-3").width($("#preview-image-box-3").height());


		if(template.rest.border_opacity) {
			$(".preview-image").css("border-style", "solid");
			$(".preview-image").css("border-width", "1px");
			$(".preview-image").css("border-color", template.rest.color);
		}
		if(template.winner.border_opacity) {
			$("#preview-image-1").css("border-style", "solid");
			$("#preview-image-1").css("border-width", "3px");
			$("#preview-image-1").css("border-color", template.winner.color);
		}
		if(template.runnerup.border_opacity) {
			$("#preview-image-2").css("border-style", "solid");
			$("#preview-image-2").css("border-width", "3px");
			$("#preview-image-2").css("border-color", template.runnerup.color);
		}
		if(template.third.border_opacity) {
			$("#preview-image-3").css("border-style", "solid");
			$("#preview-image-3").css("border-width", "2px");
			$("#preview-image-3").css("border-color", template.third.color);
		}
		if(template.present.border_opacity) {
			$("#preview-image-" + present_character).css("border-style", "solid");
			$("#preview-image-" + present_character).css("border-width", "3px");
			$("#preview-image-" + present_character).css("border-color", template.present.color);
		}

		$(".preview-character").css("color", template.rest.color);
		$("#preview-character-1").css("color", template.winner.color);
		$("#preview-character-2").css("color", template.runnerup.color);
		$("#preview-character-3").css("color", template.third.color);
		$("#preview-character-" + present_character).css("color", template.present.color);

		function newPreviewElement(i) {
			return (
				"<div class='preview-character' id='preview-character-" + pos + "'>" + 
					pos + ". <div class='preview-image-box' id='preview-image-box-" + pos + "'>" + 
					 	"<div class='preview-image' id='preview-image-" + pos + "'></div>" + 
					"</div>" + 
				 	"<div class='preview-name' id='preview-name-" + pos + "'>" + 
				 		shuffled_characters[i].name + 
				 	"</div>" + 
				 	"<div class='preview-char-score' id='preview-char-score-'" + 
				 		(pos++) + "'>" + 
				 		shuffled_characters[i].score + 
				 	"</div>" + 
				"</div>"
			);
		}

	}

})(jQuery);