// Defineret af backend, følger nedenstående schema
var _szfb_config = [{}];
var _szfb;

(function($, undefined) {

	var defaults = {
		layout: {
			corners: 8,
			comment: true,
			commentRequired: false,
			position: 'E',
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
				text: 'white',
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
				{ s: 'klima.horsens.dk', e: false }
			],
			force: false
		}
	};

	// Merge default options med det, vi har fået fra SZ-scriptet
	var _opts = [], opts = {};
	for(var i=0; i<_szfb_config.length; i++) {
		_opts[i] = $.extend(defaults, _szfb_config[i]);
	}

	// Matcher-namespace. Undersøger, om survey'et skal vises på denne side.
	var matcher = {
		loc: window.location.toString(),
		check_url: function(url) {
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
		// Side effects: Sætter opts objekt
		show: function() {
			for(var i=0; i<_opts.length; i++) {
				if(_opts[i].matches.force || (this.check_list(_opts[i].matches.include) && !this.check_list(_opts[i].matches.exclude))) {
					opts = _opts[i];
					return true;
				}
			}
			return false;
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

			function hide(complete) {
				elements.inner.slideUp(opts.layout.anim_duration, complete);
			}

			function show(complete) {
				elements.inner.slideDown(opts.layout.anim_duration, complete);
			}

			var positions = {
				// EAST
				E: { 
					css: function() { 
						elements.inner.show(); 
						return { 
							right:  (-(elements.container.width()-8)) + 'px', 
							top:    ($(window).height()-elements.container.height())/2, 
							bottom: 'auto', 
							left:   'auto' 
						} 
					}, 
					show: function(complete) {
						elements.inner.show();
						elements.container
							.show()
							.css({left: 'auto'})
							.animate({right: 0}, { duration: opts.layout.anim_duration, complete: complete });
					},
					hide: function(complete) {
						elements.container
							.show()
							.css({left: 'auto' })
							.animate({ right: -(elements.container.width()-8)}, { duration: opts.layout.anim_duration, complete: complete });
					},
					name: 'e', 
					recalc: function() {
						return {
							top: ($(window).height()-elements.container.height())/2
						};
					}
				},
				
				// WEST
				W: { 
					css: function() { 
						elements.inner.show();
						return { 
							left:   (-(elements.container.width()-8)) + 'px', 
							top:    ($(window).height()-elements.container.height())/2 ,
							bottom: 'auto',
							right:  'auto' 
						} 
					}, 
					show: function(complete) {
						elements.inner.show();
						elements.container
							.show()
							.css({right: 'auto'})
							.animate({left: 0}, { duration: opts.layout.anim_duration, complete: complete });
					},
					hide: function(complete) {
						elements.container
							.show()
							.css({right: 'auto'})
							.animate({ left: -(elements.container.width()-8) }, { duration: opts.layout.anim_duration, complete: complete });
					},
					name: 'w', 
					recalc: function() {
						return {
							top: ($(window).height()-elements.container.height())/2
						};
					}
				},

				// SOUTH
				S:  { 
					css: function() { 
						elements.inner.hide();
						return { 
							left:   ($(window).width()-elements.container.width())/2, 
							bottom: '0px', 
							top:    'auto', 
							right:  'auto' 
						} 
					},
					show: show,
					hide: hide,
					name: 's', 
					recalc: function() {
						return {
							left: ($(window).width()-elements.container.width())/2 
						};
					}
				},

				// SOUTH-EAST
				SE: { 
					css: function() { 
						elements.inner.hide();
						return { 
							right:  '10px', 
							bottom: '0px', 
							left:   'auto', 
							top:    'auto' 
						} 
					}, 
					show: show,
					hide: hide,
					name: 'se', 
					recalc: false 
				},

				// SOUTH-WEST
				SW: { 
					css: function() { 
						elements.inner.hide();
						return { 
							left:   '10px', 
							bottom: '0px', 
							top:    'auto', 
							right:  'auto' 
						} 
					}, 
					show: show,
					hide: hide,
					name: 'sw',
					recalc: false 
				}
			};

			// State machine. Sørger for at UI'et har et coherent state. Fungerer som
			// en slags controller.
			var state = new function() {
				var state = '';
				var oldstate = '';
				var pos;
				var self = this;

				// Setter kalder metode som sætter det valgte state.
				this.set = function(to) {
					self.oldstate = self.state;
					self.state = to;
					if(self[to] !== undefined) {
						elements.container
							.removeClass()
							.addClass('szfb_position_' + positions[opts.layout.position].name + ' szfb_textcolor_' + opts.layout.colors.text + ' szfb_state_' + to);
						self[to].call();
					}
				}

				// Getter returnerer aktivt state.
				this.get = function() { return self.state; }

				// INIT state. Grundliggende opsætning af tekster, farver osv.
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

					// Fjern eventuel skala, opret ny
					elements.grade.html('');
					for(var i=0; i<fields.length; i++) {
						elements.grade.append('<div class="szfb_option_wrapper"><a href="#" class="szfb_option szfb_score_' + (fields[i]+1) + '" style="background-image:url(sprites/' + _o.type + '.png); background-position:' + (-(fields[i]*28)) + 'px 0">' + (fields[i]+1) + '/5</a></div>');
					}

					// Hover-effekt på options
					// TODO: Stjerner har anderledes hover-state
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
					self.pos = positions[opts.layout.position];
					elements.container
						.css($.extend({ 
								'font-family': opts.layout.font.name,
								'font-size': opts.layout.font.size + 'px',
								'position': 'fixed'
							}, 
							self.pos.css())
						);

					function reposition() {
						if(self.pos.recalc != false) elements.container.css(self.pos.recalc());
					}

					// Bind resize handler for de positions, der kræver det
					if(self.pos.recalc != false) {
						$(window).bind('resize', reposition);
					} else {
						$(window).unbind('resize', reposition);
					}

					// Border radius
					if(opts.layout.corners > 0) {
						var br = opts.layout.corners;
						var cbr, tbr, gbr;
	
						switch(self.pos.name) {
						case 'e':
							cbr = '0px 0px 0px ' + br + 'px';
							tbr = br + 'px ' + '0px ' + '0px ' + br + 'px';
							break;
						case 'w':
							cbr = '0px 0px ' + br + 'px 0px';
							tbr = '0px ' + br + 'px ' + br + 'px 0';
							break;
						case 'sw':
						case 's':
							cbr = '0 ' + br + 'px 0 0';
							tbr = br + 'px ' + br + 'px 0 0';
							break;
						default:
							cbr = br + 'px 0 0 0';
							tbr = br + 'px ' + br + 'px 0 0';
						}

						gbr = (opts.layout.comment) ? br + 'px ' + br + 'px 0 0' : br + 'px';

						elements.content.css({ 'border-radius': cbr });
						elements.tabbar.css({ 'border-radius': tbr });
						elements.grade.css({ 'border-radius': gbr });
					}

					// Kommentarboks?
					if(opts.layout.comment) {
						elements.comment.show();
						elements.container.removeClass('szfb_no_comment');
					} else {
						elements.container.addClass('szfb_no_comment');
						elements.comment.hide();
					}

					// Tekster
					elements.toggle.text(opts.texts.title);

					// Vis boks
					elements.container.show();
				}

				this.destroy = function() {
					elements.grade.find('.szfb_option_wrapper').remove();
					elements.container.removeClass();
				}

				this.close = function() { 
					elements.container.show();
					self.pos.hide(function() { elements.toggle.text(opts.texts.title); });
				}

				this.open = function() {
					elements.container.show();
					elements.thanks.hide();
					elements.form.show();

					// Tekster
					elements.question.text(opts.texts.question);
					elements.submit.text(opts.texts.button);

					self.pos.show(function() { elements.toggle.text(opts.texts.close); });
				}

				this.invalid = function() {

				}

				this.complete = function() {
					elements.container.show();
					elements.inner.show();
					self.pos.show();
					elements.thanks.text(opts.texts.confirmation).show();
					elements.form.hide();
					elements.toggle.text(opts.texts.hide);
				}

				this.hide = function() {
					self.pos.hide(function() {
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
				case 'init':
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

			_szfb = {
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
	} else {
		_szfb = null;
	}
})(jQuery);
