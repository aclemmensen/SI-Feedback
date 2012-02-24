// Defineret af backend, følger nedenstående schema
var _sz_fb_config = {};
var szfb;

(function($, undefined) {

	var defaults = {
		layout: {
			corners: 8,
			comment: true,
			commentRequired: false,
			position: 'SE',
			anim_duration: 300,
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
				background: '#888',
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
			//console.log('checking %s (%s)', url.s, url.e ? 'exact' : 'fuzzy');
			return (url.e == true) 
				? this.loc == url.s
				: this.loc.indexOf(url.s) > -1
		},
		check_list: function(list) {
			for(var i=0; i<list.length; i++) {
				if(list[i] != undefined && this.check_url(list[i])) return true;
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
				E:  { css: function() { return { 'right': '0px', 'top': '40%', bottom: 'auto', left: 'auto' } }, name: 'e', recalc: false },
				SE: { css: function() { return { 'right': '10px', 'bottom': '0px', left: 'auto', top: 'auto' } }, name: 'se', recalc: false },
				S:  { css: function() { return { 'left': ($(window).width()-elements.container.width())/2, 'bottom': '0px', top: 'auto', right: 'auto' } }, name: 's', recalc: true },
				SW: { css: function() { return { 'left': '10px', 'bottom': '0px', top: 'auto', right: 'auto' } }, name: 'sw', recalc: false },
				W:  { css: function() { return { 'left': '0px', 'top':  ($(window).height()-elements.container.height())/2 , bottom: 'auto', right: 'auto' } }, name: 'w', recalc: true }
			};

			// State machine. Sørger for at UI'et har et coherent state. Fungerer som
			// en slags controller.
			var state = new function() {
				var state = '';
				var oldstate = '';
				var self = this;

				// Setter kalder metode som sætter det valgte state.
				this.set = function(to) {
					self.oldstate = self.state;
					self.state = to;
					//console.log('Setting state %s', to);
					if(self[to] !== undefined) {
						self[to].call();
					} else {
						//console.log('No state %s', to);
					}
				}

				// Getter returnerer aktivt state.
				this.get = function() { return self.state; }

				// Init state. Grundliggende opsætning af tekster, farver osv.
				this.init = function() {

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

					// Baggrundsfarve
					$([elements.tabbar, elements.content]).each(function() {
						this.css({'background-color': opts.layout.colors.background});
					});

					// Tekstfarve
					$([elements.toggle, elements.question, elements.thanks]).each(function() {
						this.css({color: opts.layout.colors.text});
					});

					// Fonte og position
					var position = positions[opts.layout.position];
					elements.container
						.css($.extend({ 
								'font-family': opts.layout.font.name,
								'font-size': opts.layout.font.size + 'px',
								'position': 'fixed'
							}, 
							position.css()))
						.removeClass()
						.addClass('szfb_position_' + position.name);

					if(position.recalc) {
						$(window).bind('resize', function() { 
							elements.container.css(position.css());
						});
					}

					// Border radius
					if(opts.layout.corners > 0) {
						var br = opts.layout.corners;
						var cbr, tbr, gbr;
	
						switch(position.name) {
						case 'sw':
						case 's':
							cbr = '0 ' + br + 'px 0 0';
							break;
						default:
							cbr = br + 'px 0 0 0';
						}
						tbr = br + 'px ' + br + 'px 0 0';

						gbr = (opts.layout.comment) ? tbr : br + 'px';

						elements.content.css({ 'border-radius': cbr });
						elements.tabbar.css({ 'border-radius': tbr });
						elements.grade.css({ 'border-radius': gbr });
					}

					// Vis boks
					elements.container.show();
				}

				this.destroy = function() {
					elements.grade.find('.szfb_option_wrapper').remove();
					for(i in positions) {
						elements.container.removeClass('szfb_position_' + i.name);
					}
				}

				this.close = function() { 
					elements.container.show();
					elements.inner.slideUp(opts.layout.anim_duration, function() { elements.toggle.text(opts.texts.title); });
				}

				this.open = function() {
					elements.container.show();
					elements.thanks.hide();
					elements.form.show();
					// Kommentarboks?
					if(opts.layout.comment) {
						elements.comment.show();
						elements.container.removeClass('szfb_no_comment');
					} else {
						elements.container.addClass('szfb_no_comment');
						elements.comment.hide();
					}

					// Tekster
					elements.question.text(opts.texts.question);
					elements.submit.text(opts.texts.button);

					elements.inner.slideDown(opts.layout.anim_duration, function() { elements.toggle.text(opts.texts.close); });
				}

				this.invalid = function() {

				}

				this.complete = function() {
					elements.container.show();
					elements.inner.show();
					elements.thanks.text(opts.texts.confirmation).show();
					elements.form.hide();
					elements.toggle.text(opts.texts.hide);
				}

				this.hide = function() {
					elements.container.slideUp(opts.layout.anim_duration, function() {
						elements.toggle.text(opts.texts.title);
						elements.comment.val('');
						elements.form.show();
						elements.thanks.hide();
					});
				}

				this.reload = function() {
					var resume = self.oldstate;
					self.set('destroy');
					self.set('init');
					self.set(resume);
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
				//console.log('... submitting');
				state.set('complete');
				return false;
			}

			elements.form.submit(handlesubmit);
			elements.submit.click(handlesubmit);

			state.set('init');
			state.set('open');

			szfb = {
				reload: function(new_opts) {
					opts = $.extend(opts, new_opts);
					state.set('reload');
				},
				getopts: function() {
					return opts;
				},
				setstate: function(new_state) {
					state.set(new_state);
				}
			};

		});
	}
})(jQuery);
