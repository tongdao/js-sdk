define(function() {

	function TdInAppMessage(options) {
		// IF NO IDs LOG ERROR AND RETURN 
		if (!options.mid || !options.cid) { 
			console.log('%cERROR: Message is missing IDs', 'color: #ff0000');
			return;
		}
		// IF FULL CENTERED MESSAGE WITH NO IMAGE ERROR AND RETURN
		else if ( options.layout=='full' && !options.image_url ) {
			console.log('%cERROR: Full layout message missing image', 'color: #ff0000');
			return;
		}

		this.mid = options.mid,
		this.cid = options.cid,
		this.html = options.html || '',
		this.message = options.message || '',
		this.image_url = options.image_url || '',
		this.title = options.title || '',
		this.layout = options.layout || 'top',
		this.action = options.action || null,
		this.buttons = options.buttons || [];
		// MAKE SURE VALUE OF 0 IS NOT SET AS NULL
		if ( options.display_time === undefined ) {
			// DEFAULT TO 5 IF LEFT NULL
			this.display_time = 5;
		} else {
			this.display_time = options.display_time;
		}

		// CSS ELEMENT FOR ALL MESSAGES
		this.messageStyles = {
			'#td-popup-wrapper-full': {
				'position': 'fixed',
				'top': '50%',
				'left': '50%',
				'transform': 'translate(-50%, -50%)',
				'z-index': '999'
			},
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
			// TOP AND BOTTOM LAYOUT
			'.td-message-container': { 
				'opacity': '0',
				'position': 'relative',
				'display': 'inline-block',
				'margin': '5px auto',
				'text-align': 'left',
				'border-radius': '5px',
				'box-sizing': 'border-box',
				'box-shadow': '0px 0px 40px 0px rgba(0,0,0,0.4)',
				'transition': 'all ease 0.2s',
				'vertical-align': 'middle',
			},
			'div.td-message-container': {
				'cursor': 'default'
			},
			// ADDS CLEARFIX FOR FLOAT ELEMENTS
			'#td-message-container:before, #td-message-container:after': {
				'display': 'table',
				'content': '" "'
			},
			'#td-message-container:after': {
				'clear': 'both' 
			},
			'.td-message-container.active': {
				'opacity': '1',
			},
			'.td-message-container.fade': {
				'opacity': '0'
			},
			'.td-message-link': {
				'display': 'inline-block',
				'vertical-align': 'middle'
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
				'border-radius': '5px 0 0 5px'
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
			// FULL LAYOUT MESSAGE
			'.td-message-cover': {
				'opacity': '0',
				'position': 'relative',
				'display': 'inline-block',
				'text-align': 'left',
				'border-radius': '5px',
				'box-sizing': 'border-box',
				'box-shadow': '0px 0px 40px 0px rgba(0,0,0,0.4)',
				'transition': 'all ease 0.2s'
			},
			'.td-message-cover img': {
				'max-width': '100%',
				'min-height': '100%',
				'border-radius': '5px',
				'vertical-align': 'middle'
			},
			'.td-message-cover.active': {
				'opacity': '1',
			},
			'.td-message-cover.fade': {
				'opacity': '0'
			},
			'.td-message-button': {
				'position': 'absolute',
			},
			// CLOSE BUTTON
			'#td-close-icon': {
				'position': 'absolute',
				'top': '-7px',
				'right': '-7px',
				'height': '20px',
				'width': '20px'
			},
			'.close-x': {
				'cursor': 'pointer',
				'font-size': '18px',
				'border-radius': '50%',
				'width': '21px',
				'display': 'inline-block',
				'height': '21px',
				'line-height': '18px',
				'text-align': 'center',
				'color': '#fff',
				'background-color': '#666'
			},
			'.close-x:hover': {
				'background-color': '#333'
			},
			'.close-x:after': {
				'content': '"×"'
			}
		};
	}

	TdInAppMessage.prototype.createMessageEl = function() {

		var messageEl;

		if ( this.html ){

		} else {
			
			messageEl = document.createElement('div');
			messageEl.id = 'td-popup-message-' + this.cid + this.mid;
			messageEl.setAttribute( 'class', 'td-popup-message' );

			// SET EACH ELEMENT AS A DOM STRING AND INJECT TO messageEl
			if (this.layout=='full') {

				// CREATE BUTTONS WITH INLINE STYLING
				buttonEls = [];
				var createButton = function( item, index ) {
					var buttonEl = '<a id="td-message-button-' + index + '" class="td-message-button" href="' + item.action.value + '" style="left: '+item.left+'px; top: '+item.top+'px; height: '+item.height+'px; width: '+item.width+'px;"></a>';
					buttonEls.push(buttonEl);
				};

				this.buttons.forEach( createButton );

				var button1 = buttonEls[0] ? buttonEls[0] : '',
					button2 = buttonEls[1] ? buttonEls[1] : '', 
					imgEl = '<img src="' + this.image_url + '" />',
					closeEl = '<div id="td-close-icon"><a class="close-x"></a></div>';

				messageEl.innerHTML = 
					'<div id="td-message-cover" class="td-message-cover">' + 
						imgEl +
						button1 +
						button2 + 
						closeEl +
					'</div>'

			} else {
				var imgEl = this.image_url ? '<div id="td-message-image" class="td-message-image"><img src="' + this.image_url + '" /></div>' : '',
					titleEl = this.title ?  '<div id="td-message-title" class="td-message-title">' + this.title + '</div>' : '',
					textEl = '<div id="td-message-text" class="td-message-text">' + this.message + '</div>',
					bodyEl = '<div id="td-message-body" class="td-message-body">'+ titleEl + textEl + '</div>',
					closeEl = '<div id="td-close-icon"><div class="close-x"></div></div>',
					
					// IF MESSAGE HAS ACTION > WRAP ALL BUT closeEl IN <a>
					innerMessage = ( this.action&&this.action.type=='url' ) ?
					'<a href="' + this.action.value +'" id="td-message-link" class="td-message-link">' + imgEl + bodyEl + '</a>' + closeEl : imgEl + bodyEl + closeEl ;

				// WRAP IN MSG CONTAINER AND SET AS innerHTML
				messageEl.innerHTML = '<div id="td-message-container" class="td-message-container">' + innerMessage + '</div>';
			}

		}

		return messageEl;

	}

	TdInAppMessage.prototype.injectStyles = function() {

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
        var styleText = createStyleText(this.messageStyles);
        var headEl = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
        var styleEl = document.createElement('style');
        styleEl.id = 'td-message-styles';

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
    	var preLoadImages = function() {
    		// IF NONE ATTACH IMAGE
	        if (!self.image_url) {
	            attachMessage();
	            return;
	        }

	        var _onload = function() {
	        	// SAVE IMAGE H & W > IF NONE FOUND SET DEFAULT TO TD MESSAGE CREATOR DEFAULT
        		self.image_h = imgObj.height ? imgObj.height : self.is_portrait ? 406 : 256;
        		self.image_w = imgObj.width ? imgObj.width : self.is_portrait ? 256 : 406;
        		attachMessage();
	        };

	        var imgObj = new Image();
	        imgObj.src = self.image_url;
	        imgObj.onload = _onload;

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
				msgClosing = false;

			// IF FULL SELECT COVER ELEMENT OTHERWISE CONTAINER
			var messageContainer = self.layout=='full' ? messageEl.querySelector('#td-message-cover') :
				messageEl.querySelector('#td-message-container');

			var _startDelayClose = function() {
				// IF DELAY SET TO 0 NEVER CLOSE AUTOMATICALLY
				if( self.display_time > 0 ) {
					// PREVENT RUNNING DUPLICATE CLOSINGS
					if(!msgClosing) {
						delayClose = setTimeout( function(){
							_closeMessage();
						}, self.display_time * 1000);
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
			var _addNewClass = function(element, className) {
				var currentClass = element.getAttribute('class');
				element.setAttribute('class', currentClass+' '+className);
			};

		    // IF LAYOUT FULL SET VERTICAL HEIGHT AND BUTTONS BEFORESHOWING
		    if ( self.layout == 'full' ) {
		    	messageWrapper.setAttribute('style', 'height: '+ self.image_h +'px; width: '+ self.image_w +'px;' );
		    }

			setTimeout( function(){ 
				_addNewClass(messageContainer, 'active');
				//SET TIMEOUT ACCORING TO display_time TO FADE OUT AND REMOVE OBJECT
				_startDelayClose();

				// PREVENT MESSAGE FROM FADING WHILE HOVERED OVER
				messageContainer.addEventListener('mouseenter', function(){
					msgClosing = false;
					clearTimeout(delayClose);
				});
				// RESTART FADE AFTER LEAVE
				messageContainer.addEventListener('mouseleave', function(){
					_startDelayClose(); 
				});

				// ADD CLOSE FUNCTION FOR CLOSE BUTTON
				var closeButton = messageEl.querySelector('#td-close-icon');
				closeButton.addEventListener('click', function(e){
					clearTimeout(delayClose);
					_closeMessage();
				});

				//EVENT LISTENER FOR MESSAGE CLICK ( GO TO ACTION URL );
				if ( self.layout!='full' && self.action && self.action.type=='url' ) {
					var messageLink = messageEl.querySelector('#td-message-link');
					messageLink.addEventListener('click', function(e) {
						tongdao.track('!open_message', { '!message_id': self.mid, '!campaign_id': self.cid });
					});
				}

				tongdao.track('!receive_message', { '!message_id': self.mid, '!campaign_id': self.cid });

			}, 100);

	    };

	    // CHECK FOR IMAGES AND PRELOAD BEFORE ATTACHING
	    preLoadImages();

    }

	return TdInAppMessage;
});
