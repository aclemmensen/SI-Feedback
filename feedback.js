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

		var eContainer = $('#szfb_container');
		var eToggle    = $('#szfb_toggle');
		var eThanks    = $('#szfb_thanks');
		var eQuestion  = $('#szfb_question');
		var eInner     = $('#szfb_inner');
		var eForm      = $('#szfb_form');
		var eComment   = $('#szfb_comment');
		var eSubmit    = $('#szfb_submit');

		var state = new function() {
			var state = '';
			var self = this;

			this.set = function(to) {
				self.state = to;
				console.log('Setting state %s', to);
				if(self[to] !== undefined) {
					self[to].call();
				} else {
					console.log('No state %s', to);
				}
			}

			this.get = function() { return self.state; }

			this.init = function() {
				eQuestion.text(opts.texts.question);
				eThanks.text(opts.texts.confirmation);
				self.set('closed');
			}

			this.closed = function() { 
				eInner.hide();
				eToggle.text(opts.texts.title);
			}

			this.open = function() {
				eInner.show();
				eToggle.text(opts.texts.close);
			}

			this.invalid = function() {

			}

			this.complete = function() {
				eForm.hide();
				eToggle.text(opts.texts.hide);
				eThanks.show();
			}

			this.hide = function() {
				eComment.val('');
				eForm.show();
				eThanks.hide();
				self.closed();
			}
		};

		// Changes state in this fashion: 
		// Closed -> Open -> Complete -> Hide -> Open ...
		eToggle.click(function() {
			switch(state.get()) {
			case 'closed':
				state.set('open');
				break;
			case 'open':
				state.set('closed');
				break;
			case 'complete':
				state.set('hide');
				break;
			case 'hide':
				state.set('open');
				break;
			}
		});

		function handlesubmit() {
			console.log('... submitting');
			state.set('complete');
			return false;
		}

		eForm.submit(handlesubmit);
		eSubmit.click(handlesubmit);

		state.set('init');

	});

})(jQuery);

