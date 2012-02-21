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
			corners: 8,
			comment: true,
			commentRequired: false,
			position: 'E',
			preset: {
				type: 'smiley',
				count: 5,
				style: 'red'
			},
			font: {
				name: 'Arial',
				size: '12'
			},
			colors: {
				background: '#ca0000',
				text: '#ffffff',
				error: '#ca0000'
			}
		},
		texts: {
			title: "Feedback",
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

		var elements = {
			container : $('#szfb_container'),
			tabbar    : $('#szfb_tabbar'),
			toggle    : $('#szfb_toggle'),
			content   : $('#szfb_content'),
			inner     : $('#szfb_inner'),
			thanks    : $('#szfb_thanks'),
			question  : $('#szfb_question'),
			form      : $('#szfb_form'),
			comment   : $('#szfb_comment'),
			submit    : $('#szfb_submit')
		};

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
				elements.container.css({ 'font-family': opts.layout.font.name, 'font-size': opts.layout.font.size + 'px'});

				if(opts.layout.corners > 0) {
					elements.content.css({ 'border-radius': opts.layout.corners + 'px 0 0 0'});
					elements.tabbar.css({ 'border-radius': opts.layout.corners + 'px ' + opts.layout.corners + 'px 0 0'});
				}

				if(opts.layout.comment) {
					elements.comment.css({'border-color': opts.layout.colors.text}).show();
				}

				$([elements.tabbar, elements.content]).each(function() {
					this.css({'background-color': opts.layout.colors.background});
				});

				$([elements.toggle, elements.question, elements.thanks]).each(function() {
					this.css({color: opts.layout.colors.text});
				});

				elements.question.text(opts.texts.question);
				elements.thanks.text(opts.texts.confirmation);

				self.set('closed');
			}

			this.closed = function() { 
				elements.inner.hide();
				elements.toggle.text(opts.texts.title);
			}

			this.open = function() {
				elements.inner.show();
				elements.toggle.text(opts.texts.close);
			}

			this.invalid = function() {

			}

			this.complete = function() {
				elements.form.hide();
				elements.toggle.text(opts.texts.hide);
				elements.thanks.show();
			}

			this.hide = function() {
				elements.comment.val('');
				elements.form.show();
				elements.thanks.hide();
				self.closed();
			}
		};

		// Changes state in this fashion: 
		// Closed -> Open -> Complete -> Hide -> Open ...
		elements.toggle.click(function() {
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

		elements.form.submit(handlesubmit);
		elements.submit.click(handlesubmit);

		state.set('init');
		state.set('open');

	});

})(jQuery);

