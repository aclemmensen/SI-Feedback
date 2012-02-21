// Defineret af backend, følger nedenstående schema
var _sz_fb_config = {};

(function($, undefined) {
	
	var positions = {
		E:  'right:0; top:40%;',
		SE: 'right:0; bottom: 0;',
		S:  'margin:auto 0; bottom:0;',
		SW: 'left:0; bottom:0;',
		W:  'left:0; top:40%;'
	};

	var defaults = {
		layout: {
			corners: '5',
			comment: true,
			commentRequired: false,
			position: 'E',
			preset: {
				type: 'smiley',
				count: 5,
				style: 'red'
			},
			font: {
				name: 'Verdana',
				size: '11'
			},
			colors: {
				background: '#666',
				text: '#ffffff',
				error: '#ca0000'
			}
		},
		texts: {
			title: "Hvad synes du om denne side?",
			question: "Hvad synes du?",
			button: "Send feedback",
			hide: "Skjul",
			confirmation: "Tusind tak for dit svar",
			close: "Luk",
			errors: {
				grade: "Besvar venligst spg",
				comment: "Skriv venligst en kommentar",
				commit: "Der opstod en fejl..."
			}
		},
		matches: {
			include: [
				{ s: 'horsens', e: false },
				{ s: 'klima.horsens.dk/hest', e: true }
			],
			exclude: [
				{ s: 'klima.horsens.dk', e: false }
			]
		}
	};

	var opts = $.extend(defaults, _sz_fb_config);

	function log(arg) {
		if(window['console'] != undefined) {
			console.log(arg);
		}
	}

	$(function() {

		var eToggle = $('#szfb_toggle');
		var eSubmit = $('#szfb_submit');

		var state = 'closed';
		var states = {
			closed: function() { 
				$('#szfb_inner').hide();
				eToggle.text(opts.texts.title);
				states.change('closed');
			},
			open: function() {
				$('#szfb_inner').show();
				eToggle.text(opts.texts.close);
				states.change('open');
			},
			complete: function() {
				states.change('complete');
			},
			change: function(to) {
				state = to;
				console.log('setting state %s', state);
			}
		};

		eToggle.click(function() {
			switch(state) {
				case 'open':
					states.closed();
					break;
				case 'closed':
					states.open();
					break;
				case 'complete':
					alert('yay!');
					break;
			}
		});

		function handlesubmit() {
			alert('fu');
			return false;
		}
		console.log('hej');

		$('#szfb_form').submit(handlesubmit);
		$('#szfb_submit').click(handlesubmit);
	});

})(jQuery);

