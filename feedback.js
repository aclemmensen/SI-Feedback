// Defineret af backend, følger nedenstående schema
var _sz_fb_config = {};

(function($, undefined) {

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
				{ s: 'klima.horsens.dk/hest', e: true },
				{ s: 'home', e: false },
				{ s: 'Dropbox', e: false },
				{ s: 'givetwise', e: false }
			],
			exclude: [
				{ s: 'klima.horsens.dk', e: false },
				//{ s: 'feedback', e: false }
			]
		}
	};

	// Merge default options med det, vi har fået fra SZ-scriptet
	var opts = $.extend(defaults, _sz_fb_config);

	// Matcher-namespace. Undersøger, om survey'et skal vises på denne side.
	var matcher = {
		loc: window.location.toString(),
		check_url: function(url) {
			console.log('checking %s (%s)', url.s, url.e ? 'exact' : 'fuzzy');
			return (url.e == true) 
				? this.loc == url.s
				: this.loc.indexOf(url.s) > -1
		},
		check_list: function(list) {
			for(var i=0; i<list.length; i++) {
				if(this.check_url(list[i])) return true;
			}
			return false;
		},
		show: function() {
			return this.check_list(opts.matches.include) && !this.check_list(opts.matches.exclude);
		}
	};

	// Hvis surveyet skal vises sæt document.ready op.
	if(matcher.show()) {
		$(function() {

			var elements = {
				container : $('#szfb_container'),
				tabbar    : $('#szfb_tabbar'),
				toggle    : $('#szfb_toggle'),
				content   : $('#szfb_content'),
				inner     : $('#szfb_inner'),
				question  : $('#szfb_question'),
				grade     : $('#szfb_grade'),
				options   : null,
				form      : $('#szfb_form'),
				comment   : $('#szfb_comment'),
				submit    : $('#szfb_submit'),
				thanks    : $('#szfb_thanks')
			};

			var positions = {
				E:  'right:0; top:40%;',
				SE: 'right:0; bottom: 0;',
				S:  'margin:auto 0; bottom:0;',
				SW: 'left:0; bottom:0;',
				W:  'left:0; top:40%;'
			};

			/*
			var grades = {
				smiley: [
					{ image: 'smiley-1.png', value: 1 },
					{ image: 'smiley-2.png', value: 2 },
					{ image: 'smiley-2.png', value: 3 },
					{ image: 'smiley-2.png', value: 4 },
					{ image: 'smiley-2.png', value: 5 }
				],
				stars: [
					{ image: 'star-1.png', value: 1 },
					{ image: 'star-2.png', value: 3 },
					{ image: 'star-3.png', value: 5 }
				],
				hands: [
					{ image: 'hand-down.png', value: 1 },
					{ image: 'hand-up.png', value: 5 }
				],
				numbers: [
					{ image: 'num-1.png', value: 1 },
					{ image: 'num-2.png', value: 2 },
					{ image: 'num-3.png', value: 3 },
					{ image: 'num-4.png', value: 4 },
					{ image: 'num-5.png', value: 5 }
				],
				yesno: [
					{ image: 'no.png', value: 1 },
					{ image: 'yes.png', value: 5 }
				]
			};
			*/

			// State machine. Sørger for at UI'et har et coherent state. Fungerer som
			// en slags controller.
			var state = new function() {
				var state = '';
				var self = this;

				// Setter kalder metode som sætter det valgte state.
				this.set = function(to) {
					self.state = to;
					console.log('Setting state %s', to);
					if(self[to] !== undefined) {
						self[to].call();
					} else {
						console.log('No state %s', to);
					}
				}

				// Getter returnerer aktivt state.
				this.get = function() { return self.state; }

				// Init state. Grundliggende opsætning af tekster, farver osv.
				this.init = function() {
					// Fonte
					elements.container.css({ 'font-family': opts.layout.font.name, 'font-size': opts.layout.font.size + 'px'});

					// Border radius
					if(opts.layout.corners > 0) {
						elements.content.css({ 'border-radius': opts.layout.corners + 'px 0 0 0'});
						elements.tabbar.css({ 'border-radius': opts.layout.corners + 'px ' + opts.layout.corners + 'px 0 0'});
					}

					// Skala
					var _o = opts.layout.preset;
					var fields;
					if(_o.count == 2) {
						fields = [0,4];
					} else if(_o.count == 3) {
						fields = [0,2,4];
					} else {
						fields = [0,1,2,3,4];
					}

					for(var i=0; i<fields.length; i++) {
						elements.grade.append('<div class="szfb_option_wrapper"><a href="#" class="szfb_option szfb_score_' + (fields[i]+1) + '" style="background-image:url(sprites/' + _o.type + '.png); background-position:' + (-(fields[i]*28)) + 'px 0">' + (fields[i]+1) + '/5</a></div>');
					}

					elements.options = elements.grade.find('.szfb_option');

					elements.options.click(function() {
						elements.grade.find('div, a').removeClass('szfb_selected');
						$(this).add($(this).parent()).addClass('szfb_selected');
						return false;
					});

					// Kommentarboks?
					if(opts.layout.comment) {
						elements.comment.css({'border-color': opts.layout.colors.text}).show();
					}

					// Baggrundsfarve
					$([elements.tabbar, elements.content]).each(function() {
						this.css({'background-color': opts.layout.colors.background});
					});

					// Tekstfarve
					$([elements.toggle, elements.question, elements.thanks]).each(function() {
						this.css({color: opts.layout.colors.text});
					});

					// Tekster
					elements.question.text(opts.texts.question);
					elements.thanks.text(opts.texts.confirmation);
					elements.submit.val(opts.texts.button);

					// Vis boks
					elements.container.show();

					// Originalt state
					self.set('close');
				}

				this.close = function() { 
					elements.inner.slideUp(function() { elements.toggle.text(opts.texts.title); });
				}

				this.open = function() {
					elements.inner.slideDown(function() { elements.toggle.text(opts.texts.close); });
					
				}

				this.invalid = function() {

				}

				this.complete = function() {
					elements.form.hide();
					elements.toggle.text(opts.texts.hide);
					elements.thanks.show();
				}

				this.hide = function() {
					elements.container.slideUp(function() {
						elements.toggle.text(opts.texts.title);
						elements.comment.val('');
						elements.form.show();
						elements.thanks.hide();
					});
				}
			};


			// Skifter state således:
			// close -> Open -> Complete -> Hide -> Open ...
			elements.toggle.click(function() {
				switch(state.get()) {
				case 'close':
					state.set('open');
					break;
				case 'open':
					state.set('close');
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
	} else {
		console.log("Stay hidden");
	}
})(jQuery);
