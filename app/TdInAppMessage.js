define(function() {

	function TdInAppMessage(options) {
		// IF NO IDs LOG ERROR AND RETURN 
		if (!options.mid || !options.cid) { 
			console.log('%cERROR: Message is missing IDs', 'color: #ff0000');
			return;
		}

		this.mid = options.mid,
		this.cid = options.cid,
		this.html = options.html || '',
		this.message = options.message || '',
		this.image_url = options.image_url || '',
		this.title = options.title || '',
		this.layout = options.layout || 'top',
		this.action = options.action || null;

		// MAKE SURE VALUE OF 0 IS NOT SET AS NULL
		if ( options.display_time === undefined ) {
			// DEFAULT TO 5 IF LEFT NULL
			this.display_time = 5;
		} else {
			this.display_time = options.display_time;
		}
	}

	TdInAppMessage.prototype.createMessageEl = function() {

		var messageEl;

		if ( this.html ){

		} else {
			
			messageEl = document.createElement('div');
			messageEl.id = 'td-popup-message-' + this.cid + this.mid;
			messageEl.setAttribute( 'class', 'td-popup-message' );

			// SET EACH ELEMENT AS A DOM STRING
			var imgEl, titleEl, textEl, closeEl;

			imgEl = this.image_url ? '<div id="td-message-image" class="td-message-image"><img src="'+this.image_url+'" /></div>' : '' ;
			titleEl = this.title ?  '<div id="td-message-title" class="td-message-title">'+this.title+'</div>' : '' ;
			textEl = '<div id="td-message-text" class="td-message-text">'+this.message+'</div>';

			closeEl = '<div id="td-close-icon"><a class="close-x"></a></div>';

			// SET HTML STRUCTURE OF THE MESSAGE WITH AVAILABLE ELEMENTS
			messageEl.innerHTML = 
				'<div id="td-message-container" class="td-message-container">' +
					imgEl + 
					'<div id="td-message-body" class="td-message-body">'+
						titleEl+
						textEl+
					'</div>'+
					closeEl+
				'</div>';
		}

		return messageEl;

	}

	TdInAppMessage.prototype.createMessageStyles = function() {

		var messageStyles;

		if (this.layout == 'full') {
			// CSS STYLES FOR 'FULL' or MIDDLE MESSAGES
			// TODO:


		} else {
			// CSS STYLES FOR TOP AND BOTTOM MESSAGES
			messageStyles = {
				'#td-popup-wrapper-top, #td-popup-wrapper-bottom': { 
					'width': '400px',
					'margin-left': '-200px', 
					'position': 'fixed',
					'left': '50vw',
				},
				'#td-popup-wrapper-top': {
					'top': '10px'
				},
				'#td-popup-wrapper-bottom': {
					'bottom': '10px'
				},
				'.td-popup-message': {
					'text-align': 'center'
				},
				'.td-message-container': { 
					'opacity': '0',
					'position': 'relative',
					'display': 'inline-block',
					'margin': '5px auto',
					'text-align': 'left',
					'border-radius': '10px',
					'box-sizing': 'border-box',
					'box-shadow': '0px 0px 40px 0px rgba(0,0,0,0.4)',
					'transition': 'all ease 0.2s'
				},
				// ADDS CLEARFIX FOR FLOAT ELEMENTS
				'#td-message-container:before, #td-message-container:after': {
					'display': 'table',
					'content': '" "'
				},
				'#td-message-container:after': {
					'clear': 'both' 
				},
				// SET OPACITY FOR ANIMATION
				'.td-message-container.active': {
					'opacity': '1',
				},
				'.td-message-container.fade': {
					'opacity': '0'
				},
				'.td-message-image': {
					'float': 'left',
					'overflow': 'hidden',
					'height': '75px',
					'width': '75px'
				},
				'.td-message-image img': {
					'width': '75px',
					'height': '75px',
					'border-radius': '10px 0 0 10px'
				},
				'.td-message-body': {
					'float': 'left',
					'width': '295px',
					'padding': '10px',
					'font-family': 'Trebuchet MS1, Helvetica, sans-serif',
					'letter-spacing': '0.5px',
					'color': '#333'
				},
				'.td-message-title': {
					'font-size': '24px',
					'margin-bottom': '2px'
				},
				'.td-message-text': {
					'font-size': '16px',
					'line-height': '18px'
				},
				'.td-message-title+.td-message-text': {
					'font-size': '14px',
					'line-height': '15px',
					'color': '#666',
				},
				'#td-close-icon': {
					'position': 'absolute',
					'top': '-10px',
					'right': '-10px',
					'height': '25px',
					'width': '25px'
				},
				'.close-x': {
					'cursor': 'pointer',
					'font-size': '20px',
					'border-radius': '50%',
					'width': '25px',
					'display': 'inline-block',
					'height': '25px',
					'line-height': '24px',
					'text-align': 'center',
					'color': '#fff',
					'background-color': '#999'
				},
				'.close-x:hover': {
					'background-color': '#666'
				},
				'.close-x:after': {
					'content': '"×"'
				}
			};
		}

		return messageStyles;
	}

	TdInAppMessage.prototype.injectStyles = function(styles) {

        var createStyleText = function(styleDefs) {
            var st = '';
            for (var selector in styleDefs) {
                st += '\n' + selector + ' {';
                var props = styleDefs[selector];
                for (var k in props) {
                    st += k + ':' + props[k] + ';';
                }
                st += '}';
            }
            return st;
        };

        // ATTACH STYLES TO DOM
        var styleText = createStyleText(styles);
        var headEl = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
        var styleEl = document.createElement('style');

        headEl.appendChild(styleEl);
        styleEl.setAttribute('type', 'text/css');

        if (styleEl.styleSheet) { // IE
            styleEl.styleSheet.cssText = styleText;
        } else {
            styleEl.textContent = styleText;
        }

    }

    TdInAppMessage.prototype.attachMessageEl = function(messageEl, messageWrapper) {
    	var self = this;
    	var preLoadImages = function(loadedCallback) {
    		// IF NONE ATTACH IMAGE
	        if (!self.image_url) {
	            loadedCallback();
	            return;
	        }

	        var _onload = function() {
	            loadedCallback();
	        };

	        var imgObj = new Image();
	        imgObj.onload = _onload;
	        imgObj.src = self.image_url;
	        if (imgObj.complete) {
	            _onload();
	        }

	    };

	    var attachMessage = function() {
	    	// ATTACH MESSAGE ELEMENT TO MESSAGES WRAPPER
	    	// IF TOP LAYOUT PREPEND TO TOP
	    	if (self.layout=='top'){
	    		messageWrapper.insertBefore(messageEl, messageWrapper.childNodes[0]);
	    	} else {
	    		// ELSE APPEND TO BOTTOM 
	    		messageWrapper.appendChild(messageEl);
	    	}
			// WAIT FOR DOM ELEMENT TO BE CREATED TO APPLY CSS CLASS -> TRIGGERING ANIMATION
			var delayClose,
				messageContainer = messageEl.querySelector('#td-message-container'),
				msgClosing = false;
				delay = self.display_time;

			setTimeout( function(){ 
				_addNewClass(messageContainer, 'active');
				//SET TIMEOUT ACCORING TO display_time TO FADE OUT AND REMOVE OBJECT
				_startDelayClose();

				// PREVENT MESSAGE FROM FADING WHILE HOVERED OVER
				messageEl.addEventListener('mouseenter', function(){
					msgClosing = false;
					clearTimeout(delayClose);
				});
				// RESTART FADE AFTER LEAVE
				messageEl.addEventListener('mouseleave', function(){
					_startDelayClose(); 
				});

				// ADD HIDE FUNCTION FOR CLOSE BUTTON
				var closeButton = messageEl.querySelector('#td-close-icon');
				closeButton.addEventListener('click', function(e){
					clearTimeout(delayClose);
					_closeMessage();
				});

			}, 100);

			var _startDelayClose = function() {
				// IF DELAY SET TO 0 NEVER CLOSE AUTOMATICALLY
				if( delay !== 0 ) {
					// IF NULL OR NOT ZERO SET DELAY TIME IN SECONDS
					delay = delay || 5;
					// PREVENT RUNNING DUPLICATE CLOSINGS
					if(!msgClosing) {
						delayClose = setTimeout( function(){
							_closeMessage();
						}, delay * 1000);
					}
				}
			};

			var _closeMessage = function() {
				msgClosing = true;
				_addNewClass( messageContainer, 'fade');
				// WAIT FOR ANIMATION TIMING 0.2s THEN REMOVE NODE
				setTimeout( function(){
					messageWrapper.removeChild(messageEl);
					if (!messageWrapper.hasChildNodes()) {
						document.body.removeChild(messageWrapper);
					}
				}, 200);
			};

			//EVENT LISTENER FOR MESSAGE CLICK ( GO TO ACTION URL );
			if ( self.action && self.action.type=='url' ) {
				messageContainer.addEventListener('click', function(e) {
					//STOP FIRING ON CLICKING CLOSE
					if( e.target != this ) { return; }
					
					if(self.new_window){
						window.open(self.action.value, '_blank');
					} else {
						window.location.href = self.action.value;
					}
				});
			}

			var _addNewClass = function(element, className) {
				var currentClass = element.getAttribute('class');
				element.setAttribute('class', currentClass+' '+className);
			};


	    };

	    // CHECK FOR IMAGES AND PRELOAD BEFORE ATTACHING
	    preLoadImages(attachMessage);

    }

	return TdInAppMessage;
});
