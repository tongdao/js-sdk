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
		
		this.mid = options.mid;
		this.cid = options.cid;
		this.template = options.template || '';
		this.style = options.style || '';
		this.script = options.script || '';
		this.message = options.message || '';
		this.image_url = options.image_url || '';
		this.title = options.title || '';
		this.layout = options.layout || 'top';
		this.action = options.action || null;
		this.buttons = options.buttons || [];

		// MAKE SURE VALUE OF 0 IS NOT SET AS NULL
		if ( options.display_time === undefined ) {
			// DEFAULT TO 5 IF LEFT NULL
			this.display_time = 5;
		} else {
			this.display_time = options.display_time;
		}

		// CSS ELEMENT FOR ALL MESSAGES
		this.wrapperStyles = {
			'#td-wrapper-full': {
				'position': 'fixed',
				'top': '50%',
				'left': '50%',
				'transform': 'translate(-50%, -50%)',
				'z-index': '999'
			},
			'#td-wrapper-top, #td-wrapper-bottom': { 
				'width': '100%',
				'max-width': '400px',
				'position': 'fixed',
				'left': '50%',
				'transform': 'translateX(-50%)',
			},
			'#td-wrapper-top': {
				'top': '10px'
			},
			'#td-wrapper-bottom': {
				'bottom': '10px'
			}
		};
	}

	TdInAppMessage.prototype.createMessageEl = function() {
		var $this = this;
		var messageEl;
		
		// ADD CSS STYLES INSIDE OF MESSAGE INSTANCE
		var injectStyle = function() {
	        var cssFile = document.createElement('link');
	        cssFile.setAttribute('rel', 'stylesheet');
	        cssFile.setAttribute('type', 'text/css');
	        cssFile.setAttribute('href', $this.style);

        	// messageEl.appendChild(cssFile);
        	messageEl.insertBefore(cssFile, messageEl.childNodes[0]);
		}
		// ADD JS SCRIPT INSIDE OF MESSAGE INSTANCE
		var injectScript = function() {
	    	var scriptFile = document.createElement('script');
	        scriptFile.setAttribute('src', $this.script);
        	messageEl.appendChild(scriptFile);
	    }

		if ( this.template ){
			// CREATE NODE FROM TEMPLATE STRING
			var div = document.createElement('div');
			div.innerHTML = this.template;
			messageEl = div.childNodes[0];
			injectStyle();
			injectScript();

		// KEEP OLD METHOD INCASE OF MISSING TEMPLATE
		} else {
			messageEl = document.createElement('div');
			messageEl.id = 'td-message-' + this.cid + this.mid;
			messageEl.setAttribute( 'class', 'td-message' );

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

			// TODO: DO WE NEED FALLBACK IF NO CSS OR SCRIPT FILE IN MSG JSON?
			injectStyle();
			injectScript();

		}

		return messageEl;

	}

	TdInAppMessage.prototype.createWrapperEl = function() {

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

        var headEl = document.head || document.getElementsByTagName('head')[0] || document.documentElement;

        // ATTACH WRAPPER STYLES TO DOM
        if ( !document.getElementById('td-wrapper-styles') ) {
	        var styleText = createStyleText(this.wrapperStyles);
	        var styleEl = document.createElement('style');
	        styleEl.id = 'td-wrapper-styles';
	        styleEl.setAttribute('type', 'text/css');

	        headEl.appendChild(styleEl);

	        if (styleEl.styleSheet) { // IE
	            styleEl.styleSheet.cssText = styleText;
	        } else {
	            styleEl.textContent = styleText;
	        }
	    }

    }

    TdInAppMessage.prototype.attachMessageEl = function(messageEl, messageWrapper) {
    	// ATTACH MESSAGE ELEMENT TO MESSAGES WRAPPER
    	// IF TOP LAYOUT PREPEND TO TOP
    	if (this.layout=='top' && messageWrapper.childNodes.length){
    		messageWrapper.insertBefore(messageEl, messageWrapper.childNodes[0]);
    	} else {
    		// ELSE APPEND TO BOTTOM
    		messageWrapper.appendChild(messageEl);
    	}
    }

	return TdInAppMessage;
});
