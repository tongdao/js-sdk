(function(){

	// CONTAINER DOM EL
	var container,
	// MESSAGE DATA
		message = {},
		ios = false;

	// FOR iOS DEVICES ONLY > MAKE BRIDGE CONNECTION FOR FUNCTION COMMUNICATION
	var setupWebViewJavascriptBridge = function(callback) {
        if ( window.WebViewJavascriptBridge ) { 
        	return callback( WebViewJavascriptBridge ); 
        }
        if ( window.WVJBCallbacks ) { 
        	return window.WVJBCallbacks.push( callback ); 
        }
        window.WVJBCallbacks = [callback];

        var WVJBIframe = document.createElement('iframe');
        WVJBIframe.style.display = 'none';
        WVJBIframe.src = 'https://__bridge_loaded__';
        document.documentElement.appendChild(WVJBIframe);
        setTimeout( function() { 
        	document.documentElement.removeChild(WVJBIframe) 
        }, 0);
    };

	var loadMessage = function() {

		container = document.getElementById('td-message-container') || document.getElementById('td-message-cover');
		// GET MESSAGE DATA FROM CONTAINER DATASETS
		message.layout = container.dataset.layout;
		message.display_time = container.dataset.displayTime;

		// LOOK FOR IMAGE DIV AND GET URL FROM IMG ELEMENT
		var image = message.layout=='full' ? container :
			container.querySelector('#td-message-image');
		
		if (image) {
			message.image_url = image.querySelector('img').getAttribute('src');
		}

		// IF IMAGE > PRELOAD
        if (message.image_url) {
        	preLoadImages();
        } else {
            displayMessage();
        }
	};

	var preLoadImages = function() {

        var _onload = function() {
        	// SAVE IMAGE H & W > IF NONE FOUND SET DEFAULT TO TD MESSAGE CREATOR DEFAULT
    		message.image_h = imgObj.height;
    		message.image_w = imgObj.width;
    		displayMessage();
        };

        var imgObj = new Image();
        imgObj.src = message.image_url;
        imgObj.onload = _onload;
    };

	var displayMessage = function(){
		// REMOVE HIDDEN ON CONTINER
		// container.className = container.className.replace(/\bhidden\b/,'');
		container.className += ' active';
		// WAIT FOR DOM ELEMENT TO BE CREATED TO APPLY CSS CLASS -> TRIGGERING ANIMATION
		var delayClose,
			msgClosing = false;

		var _startDelayClose = function() {
			// IF DELAY SET TO 0 NEVER CLOSE AUTOMATICALLY
			if( message.display_time > 0 ) {
				// PREVENT RUNNING DUPLICATE CLOSINGS
				if(!msgClosing) {
					delayClose = setTimeout( function(){
						_closeMessage();
					}, message.display_time * 1000);
				}
			}
		};

		var _closeMessage = function() {
			msgClosing = true;
			_addNewClass( container, 'fade');
			// WAIT FOR ANIMATION TIMING 0.2s THEN REMOVE NODE
			setTimeout( function(){
				webviewFunction( 'closeMessage' );
			}, 200);
		};

		var _addNewClass = function(element, className) {
			var currentClass = element.getAttribute('class');
			element.setAttribute('class', currentClass+' '+className);
		};

	  	// IF LAYOUT FULL SET VERTICAL HEIGHT AND BUTTONS BEFORE SHOWING
	    if ( message.layout == 'full' ) {

	    	// GET WRAPPER > IF WEBVIEW JUST USE WINDOW
			var wrapper = document.getElementById('td-wrapper-' + message.layout );
			var img = container.querySelector('img');
			var buttonLinks = container.querySelectorAll('.td-message-button')

			if ( wrapper ) {
				wrapper.setAttribute('style', 'height: '+ message.image_h +'px; width: '+ message.image_w +'px;' );
			} else {
				// DETECT WHICH WAY TO STRECH 100%;
				// GET WEBVIEW ATTRIBUTES
				var windowSettings = webviewFunction( 'getWindowSettings' );
				var view;
				if ( typeof windowSettings == 'string' ) {
					view = JSON.parse( windowSettings );
				} else {
					view = windowSettings;
				}

				view.width = parseInt(view.width);
				view.height = parseInt(view.height);
				var wDif = view.width / message.image_w;
				var hDif = view.height / message.image_h;

				var sizeAttr;
				if ( wDif < hDif ) {
					sizeAttr = 'width: ' + view.width + 'px; ' +
								'height: ' + ( message.image_h * wDif ) + 'px;';
				} else {
					sizeAttr = 'height: ' + view.height + 'px; ' +
								'width: ' + ( message.image_w * hDif ) + 'px;';
				}

				container.setAttribute('style', sizeAttr );
				img.setAttribute('style', sizeAttr );
				
			}

			// SET BUTTONS BASED ON IMG/CONTAINER SIZE
			if( buttonLinks.length ) {
				for ( var i = 0; i < buttonLinks.length; i++ ) {
					var buttonX = parseFloat(buttonLinks[i].dataset.x),
						buttonY = parseFloat(buttonLinks[i].dataset.y),
						buttonH = parseFloat(buttonLinks[i].dataset.h),
						buttonW = parseFloat(buttonLinks[i].dataset.w);

					buttonLinks[i].setAttribute('style', 'top: ' + ( buttonY * 100 ) + '%; ' + 'left: ' + ( buttonX * 100 ) + '%; ' + 'width: ' + ( buttonW * 100 ) + '%; ' + 'height: ' + ( buttonH * 100 ) + '%;' );	
				}
			}
	    }

		setTimeout( function(){ 

			_addNewClass(container, 'active');
			//SET TIMEOUT ACCORING TO display_time TO FADE OUT AND REMOVE OBJECT
			_startDelayClose();

			// PREVENT MESSAGE FROM FADING WHILE HOVERED OVER
			container.addEventListener('mouseenter', function(){
				msgClosing = false;
				clearTimeout(delayClose);
			});
			// RESTART FADE AFTER LEAVE
			container.addEventListener('mouseleave', function(){
				_startDelayClose(); 
			});

			// ADD CLOSE FUNCTION FOR CLOSE BUTTON
			var closeButton = container.querySelector('#td-close-icon');
			closeButton.addEventListener('click', function(e){
				clearTimeout(delayClose);
				_closeMessage();
			});

			//EVENT LISTENER FOR MESSAGE CLICK ( GO TO ACTION URL );
			if ( message.layout!='full' ) {
				var messageLink = container.querySelector('#td-message-btn');
				if ( messageLink ) {
					// GET LINK DATA FROM CTA DATASETS
					var href = messageLink.dataset.href;
					var type = messageLink.dataset.type;
					messageLink.addEventListener('click', function(e) {
						webviewFunction( 'trackOpen', { href: href, type: type } );
					});
				}
			} else {
				var buttonLinks = container.querySelectorAll('.td-message-button') || [];
				if( buttonLinks.length ) {

					for ( var i = 0; i < buttonLinks.length; i++ ) {
						var href = buttonLinks[i].dataset.href;
						var type = buttonLinks[i].dataset.type;
						buttonLinks[i].addEventListener('click', function(e){
							webviewFunction( 'trackOpen', { href: href, type: type } );
						});
					}
				}
			}

			webviewFunction( 'trackReceive' );

		}, 100);
	};

	var webviewFunction = function( functionName, data ) {
		if ( ios ) {
			WebViewJavascriptBridge.callHandler( functionName, data, function responseCallback(responseData) {
				if ( responseData ) {
					console.log("JS received response:", responseData);
	            	return responseData;
				}
	        });
		} else {
			td_wv[functionName](data);
		}
	};
	// LOAD ALL IMAGES BEFORE DISPLAY
	var userAgent = navigator.userAgent || navigator.vendor || window.opera;
    // IF IOS DEVICE, BUILD BRIDGE FROM DEVICE TO WEBVIEW
    if ( /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream ) {
    	ios = true;
	    setupWebViewJavascriptBridge( function( bridge ) {

	        bridge.registerHandler('JS Echo', function(data, responseCallback) {
	            console.log("JS Echo called with:", data)
	            responseCallback(data)
	        });
	        // AFTER BRIDGE COMPLETED LOAD MESSAGE
	        loadMessage();
	    } );
    } else {
    // ELSE JUST LOAD MESSAGE
    	loadMessage();
    }

})();