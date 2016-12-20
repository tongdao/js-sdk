(function(){

	// CONTAINER DOM EL
	var container,
	// MESSAGE DATA
		message = {};

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
				td_wv.closeMessage();
			}, 200);
		};

		var _addNewClass = function(element, className) {
			var currentClass = element.getAttribute('class');
			element.setAttribute('class', currentClass+' '+className);
		};

	  	// IF LAYOUT FULL SET VERTICAL HEIGHT AND BUTTONS BEFORESHOWING
	    if ( message.layout == 'full' ) {

	    	// GET WRAPPER > IF WEBVIEW JUST USE WINDOW
			var wrapper = document.getElementById('td-wrapper-' + message.layout );

			if ( wrapper ) {
				wrapper.setAttribute('style', 'height: '+ message.image_h +'px; width: '+ message.image_w +'px;' );
			} else {
				container.setAttribute('style', 'height: '+ window.innerHeight +'px; width: '+ window.innerWidth +'px;' );

				// DETECH WHICH WAY TO STRECH 100%;
				var wDif = window.innerWidth / message.image_w;
				var hDif = window.innerHeight / message.image_h;
				var attr = wDif < hDif ? 'width' : 'height';

				var img = container.querySelector('img');
				img.setAttribute('style', attr + ': 100%;' );
				
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
						td_wv.trackOpen(href, type);
					});
				}
			} else {
				var buttonLinks = container.querySelectorAll('.td-message-button') || [];
				if( buttonLinks.length ) {
					buttonLinks.forEach( function(btn){
						var href = btn.dataset.href;
						var type = btn.dataset.type;
						btn.addEventListener('click', function(e){
							td_wv.trackOpen(href, type);
						});
					});
				}
			}

			td_wv.trackReceive();

		}, 100);
	};
	// LOAD ALL IMAGES BEFORE DISPLAY
	loadMessage();

})();