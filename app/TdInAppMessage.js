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
				'border-radius': '15px',
				'padding': '10px',
				'box-sizing': 'border-box',
				'box-shadow': '0px 0px 40px 0px rgba(0,0,0,0.4)',
				'transition': 'all ease 0.2s',
			},
			'.td-message-container *': {
				'box-sizing': 'border-box'
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
			'.td-message-image': {
				'overflow': 'hidden',
				'display': 'inline-block',
				'vertical-align': 'bottom',
				'height': '75px',
				'width': '75px'
			},
			'.td-message-image img': {
				'width': '75px',
				'height': '75px',
				'border-radius': '10px'
			},
			'.td-message-body': {
				'width': '295px',
				'height': '75px',
				'display': 'inline-block',
				'padding': '0 10px',
				'vertical-align': 'top',
				'font-family': 'Helvetica, Arial, "Microsoft YaHei", 微软雅黑, "SimHei", "中易黑体",sans-serif',
				'letter-spacing': '0.5px',
				'color': '#333'
			},
			'.td-message-title': {
				'font-size': '22px',
				'margin-bottom': '2px'
			},
			'.td-message-text': {
				'font-size': '16px',
				'line-height': '18px'
			},
			'.td-message-title+.td-message-text': {
				'font-size': '14px',
				'line-height': '16px',
				'color': '#666',
			},
			// CALL TO ACTIONS
			'.td-message-action': {
				'display': 'inline-block',
				'margin-left': '10px'
			},
			'.td-message-btn': {
				'display': 'inline-block',
				'padding': '10px 20px',
				'border-radius': '5px',
				'font-size': '16px',
				'font-weight': 'lighter',
				'font-family': 'Helvetica, Arial, "Microsoft YaHei", 微软雅黑, "SimHei", "中易黑体",sans-serif',
				'text-decoration': 'none'
			},
			'.td-btn-primary': {
				'background-color': '#007FDA',
				'border-color': '#007FDA',
				'color': '#fff'
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
			'.td-close-icon': {
				'position': 'absolute',
				'top': '5px',
				'right': '5px',
				'cursor': 'pointer',
				'border-radius': '50%',
				'width': '30px',
				'display': 'inline-block',
				'height': '30px',
				'background-color': '#333',
				'opacity': '0.4',
				'-webkit-backface-visibility': 'hidden'
			},
			'.td-close-icon:hover': {
				'opacity': '1'
			},
			'.td-close-icon:after, .td-close-icon:before': {
				'position': 'absolute',
				'left': '13px',
				'content': '""',
				'background-color': '#fff',
				'height': '18px',
				'width': '4px',
				'border-radius': '2px',
				'top': '6px'
			},
			'.td-close-icon:before': {
			 	'transform': 'rotate(45deg)'
			},
			'.td-close-icon:after': {
			 	'transform': 'rotate(-45deg)'
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
					closeEl = '<div id="td-close-icon" class="td-close-icon"></div>';

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
					// IF MESSAGE HAS ACTION > ADD CALL TO ACTION BTN
					actionEl = this.action.value ? '<a href="' + this.action.value +'" id="td-message-btn" class="td-message-btn td-btn-primary">' + this.action.title + '</a>' : '',
					closeEl = '<div id="td-close-icon" class="td-close-icon"></div>';

				// WRAP IN MSG CONTAINER AND SET AS innerHTML
				messageEl.innerHTML = '<div id="td-message-container" class="td-message-container">' + imgEl + bodyEl + actionEl + closeEl + '</div>';
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
					var messageLink = messageEl.querySelector('#td-message-btn');
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
