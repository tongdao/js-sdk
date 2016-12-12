define(['./DefaultOptions', './Cookie', './uuid', './libs/ua-parser', './Request', './Validator', './TdOrder', './TdOrderLine', './TdProduct', './TdInAppMessage'],
function(DEFAULT_OPTIONS, Cookie, UUID, UAParser, Request, Validator, TdOrder, TdOrderLine, TdProduct, TdInAppMessage) {
	var IDENTIFY_EVENT = 'identify';
	var TRACK_EVENT = 'track';
	var MERGE_EVENT = 'merge';
	var unsentEvents = [];
	var options = DEFAULT_OPTIONS;
	var ua = new UAParser(navigator.userAgent).getResult();

	function _log(m) {
		console.log('[TongDao] ' + m);
	}

	function _loadCookieData() {
		var cookieData = Cookie.get(options.cookieName);
		if (cookieData) {
			if (cookieData.deviceId) {
				options.deviceId = cookieData.deviceId;
			}
			if (cookieData.userId) {
				options.userId = cookieData.userId;
			}
			if (cookieData.cookieId) {
				options.cookieId = cookieData.cookieId;
			}
			if (cookieData.optOut !== null && cookieData.optOut !== undefined) {
				options.optOut = cookieData.optOut;
			}
		}
	}

	function _saveCookieData() {
		Cookie.set(options.cookieName, {
			deviceId: options.deviceId,
			userId: options.userId,
			cookieId: options.cookieId,
			optOut: options.optOut
		});
	}

	function init(appKey, opt_userId, opt_config, callback) {
		_log('init');
		try {
			options.appKey = appKey;
			if (opt_config) {
				if (opt_config.domain !== undefined) {
					options.domain = opt_config.domain;
				}
				if (opt_config.includeUtm !== undefined) {
					options.includeUtm = !!opt_config.includeUtm;
				}
				if (opt_config.includeReferrer !== undefined) {
					options.includeReferrer = !!opt_config.includeReferrer;
				}
				options.platform = opt_config.platform || options.platform;
				options.language = opt_config.language || options.language;
				options.sessionTimeout = opt_config.sessionTimeout || options.sessionTimeout;
				options.uploadBatchSize = opt_config.uploadBatchSize || options.uploadBatchSize;
				options.eventUploadThreshold = opt_config.eventUploadThreshold || options.eventUploadThreshold;
				options.savedMaxCount = opt_config.savedMaxCount || options.savedMaxCount;
				options.eventUploadPeriodMillis = opt_config.eventUploadPeriodMillis || options.eventUploadPeriodMillis;
			}
			Cookie.init({
				expirationDays: options.cookieExpirationDays,
				domain: options.domain
			});
			options.domain = Cookie.options().domain;
			_loadCookieData();
			var newUser = false;
			if(!options.deviceId) {
				newUser = true;
			}
			options.deviceId = (opt_config && opt_config.deviceId) || options.deviceId || UUID();
			options.userId = opt_userId || options.userId || null;
			options.cookieId = options.cookieId || options.deviceId;
			_saveCookieData();
		} catch (e) {
			_log('Error on init:' + e);
		}
		if (newUser) {
			identifyUserAgent(callback);
		}
		window.onload = function() {
			_openApp();
			_openAndClosePageDetection();
		}
	}

	function _openAndClosePageDetection() {
		var oldUrl = window.location.href;
		var detect = function() {
			var newUrl = window.location.href
			if(oldUrl === newUrl) {
				return;
			}
			_logEvents([{
				action: TRACK_EVENT,
				type: '!close_page',
				properties: {
					"!name": options.openedPagePath,
					"!started_at": options.startedPageAt
				}
			},{
				action: TRACK_EVENT,
				type: '!open_page',
				properties: {
					"!name": newUrl
				}
			}]);
			oldUrl = newUrl;
			options.startedPageAt = new Date().toISOString();
			options.openedPagePath = newUrl;
		};
		setInterval(detect, options.changeUrlDetectionMillis);
	}

	function _openApp() {
		options.startedAppAt = new Date().toISOString();
		options.startedPageAt = options.startedAppAt;
		options.openedAppPath = window.location.href;
		options.openedPagePath = options.openedAppPath;
		_logEvents([{
			action: TRACK_EVENT,
			type: '!open_app',
			properties: {
				"!name": options.openedAppPath,
				"!started_at": options.startedAppAt
			}
		}, {
			action: TRACK_EVENT,
			type: '!open_page',
			properties: {
				"!name": options.openedPagePath
			}
		}]);
		window.onbeforeunload = function () {
			_closeApp();
		};
	}

	function _closeApp() {
		options.async = false;
		_logEvents([{
			action: TRACK_EVENT,
			type: '!close_page',
			properties: {
				"!name": options.openedPagePath,
				"!started_at": options.startedPageAt
			}
		}, {
			action: TRACK_EVENT,
			type: '!close_app',
			properties: {
				"!name": options.openedAppPath,
				"!started_at": options.startedAppAt
			}
		}]);
	}

	function runQueuedFunctions(_q) {
		if(!_q) {
			return;
		}
		_log('queued: ' + _q.length);
		for (var i = 0; i < _q.length; i++) {
			var fn = this[_q[i][0]];
			if (fn && typeof fn === 'function') {
				fn.apply(this, _q[i].slice(1));
			}
		}
		_q = [];
	}

	function _logEvents(events, callback) {
		if (typeof callback !== 'function') {
			callback = null;
		}
		if (options.optOut) {
			if(callback) {
				callback(0, 'No request sent');
			}
			return;
		}
		if(events.length === 0) {
			return;
		}
		try {
			for(var i = 0; i < events.length; i++) {
				var event = events[i];
				if (event.properties && typeof event.properties !== 'object' ) {
					_log('Track Event ' + event.type + ': properties not an object');
					continue;
				}
				if (!event.action) {
					_log('Event ' + event.type + ' has no action. Skipped.');
					continue;
				}
				var eventProperties = event.properties || {};
				var userProperties = event.userProperties || {};
				var data = {
					action: event.action,
					user_id: options.userId || options.deviceId,
					properties: eventProperties,
					timestamp: getISOString()
				}
				for(var prop in userProperties) {
					if(userProperties.hasOwnProperty(prop)) {
						data[prop] = userProperties[prop];
					}
				}
				if (event.type) {
					data.event = event.type;
				}
				_setUnsentEvents(data);
			}
			sendEvents(callback);
		} catch (e) {
			_log( '_logEvents: ' + e);
		}
	}

	function pad(number) {
		if (number < 10) {
			return '0' + number;
		}
		return number;
	}

	function getISOString() {
		var d = new Date();
		return d.getUTCFullYear() +
			'-' + pad(d.getUTCMonth() + 1) +
			'-' + pad(d.getUTCDate()) +
			'T' + pad(d.getUTCHours()) +
			':' + pad(d.getUTCMinutes()) +
			':' + pad(d.getUTCSeconds()) +
			'.' + (d.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
		'Z';
	}

	function _logEvent(action, eventType, eventProperties, callback) {
		_logEvents([{
			action: action,
			type: eventType,
			properties: eventProperties
		}], callback);
	}

	function sendEvents(callback) {
		if (options.optOut || unsentEvents.length === 0) {
			if(callback && typeof callback === 'function') {
				callback(0, 'No request sent');
			}
			return;
		}
		var url = options.apiEndpoint;
		var appKey = options.appKey;
		var async = true;
		if(options.async !== undefined && options.async !== null) {
			async = !!options.async;
		}
		var data = {
			events: _pollEventsToSend()
		};
		new Request('POST', url, data, appKey, async).send(function(status, response) {
			try {
				if (status === 204 || status === 200) {
					sendEvents(callback);
				} else {
					_returnEventsToUnsent(data.events);
					if (status === 413) {
						_log('Request too large');
						if (options.uploadBatchSize === 1) {
							unsentEvents.splice(0, 1);
						}
						options.uploadBatchSize = Math.ceil(numEvents / 2);
						sendEvents(callback);
					} else if (callback) {
						_log('Unhandled error ' + status);
						callback(status, response);
					}
				}
			} catch (e) {
				_log('Upload failed' + e);
			}
		});
	}

	function _limitEventsQueue(events) {
		var exceedCount = events.length - options.uploadBatchSize;
		if(exceedCount > 0) {
			events.splice(0, exceedCount);
		}
	}

	function _setUnsentEvents(events) {
		unsentEvents.push(events);
		_limitEventsQueue(unsentEvents);
	}

	function _pollEventsToSend() {
		var eventsCount = Math.min(unsentEvents.length, options.uploadBatchSize);
		return unsentEvents.splice(0, eventsCount);
	}

	function _returnEventsToUnsent(events) {
		unsentEvents = events.concat(unsentEvents);
		_limitEventsQueue(unsentEvents);
	}

	function setDomain(domain) {
		try {
			Cookie.init({
				domain: domain
			});
			options.domain = Cookie.options().domain;
			_loadCookieData();
			_saveCookieData();
		} catch (e) {
			_log('setDomain: ' + e );
		}
	}

	function setUserId(userId) {
		try {
			var mergeAction = userId !== null && userId !== undefined;
			var previousId = options.userId || options.deviceId || '';
			options.userId = userId || null;
			_saveCookieData();
			if(mergeAction) {
				_logEvents([{
					action: MERGE_EVENT,
					userProperties: {
						previous_id: previousId
					}
				}]);
			} else {
				identifyUserAgent();
			}
		} catch (e) {
			_log('setUserId: ' + e );
		}
	}

	function setOptOut(enable) {
		try {
			options.optOut = enable;
			_saveCookieData();
		} catch (e) {
			_log('setOptOut: ' + e );
		}
	}

	function setDeviceId(deviceId) {
		try {
			options.deviceId = deviceId;
			_saveCookieData();
		} catch (e) {
			_log('setDeviceId: ' + e );
		}
	}

	function setUserProperties(userProperties) {
		identify(userProperties);
	}

	function identifyUserAgent(callback) {
		var eventProperties = {
			'!device':{
				'!os_name': ua.os.name || null,
				'!os_version': ua.os.version || null,
				'!language': options.language,
				'!model': ua.device.model || null
			},
			'!fingerprint': {
				'!uuid': options.userId || options.deviceId
			}
		}
		_logEvent(IDENTIFY_EVENT, null, eventProperties, callback);
	}

	function identify(userProperties, callback) {
		_logEvent(IDENTIFY_EVENT, null, userProperties, callback);
	}

	function track(eventType, eventProperties, callback) {
		_logEvent(TRACK_EVENT, eventType, eventProperties, callback);
	}

	function setVersionName(versionName) {
		try {
			options.versionName = versionName;
		} catch (e) {
			log( 'setVersionName' + e );
		}
	}

	function identifyFullName(fullName) {
		fullName = fullName || '';
		if(!fullName) {
			return;
		}
		identify({'!name': fullName});
	}

	function identifyEmail(email) {
		if(!Validator.validateEmail(email)) {
			_log('Email is not valid: ' + email);
			return;
		}
		identify({'!email': email});
	}

	function identifyPhone(phone) {
		if(!Validator.validatePhone(phone)) {
			_log('Phone is not valid: ' + phone);
			return;
		}
		identify({'!phone': phone});
	}

	function identifyGender(gender) {
		if(!Validator.validageGender(gender)) {
			_log('Gender is not valid: ' + gender);
			return;
		}
		identify({'!gender': gender});
	}

	function identifyAge(age) {
		if(!Validator.validateAge(age)) {
			_log('Age is not valid: ' + age);
			return;
		}
		identify({'!age': age});
	}

	function identifyAvatar(url) {
		if(!Validator.validateUrl(url)) {
			_log('Url is not valid: ' + url);
			return;
		}
		identify({'!avatar': url});
	}

	function identifyBirthday(date) {
		if(!Validator.validateDate(date)) {
			_log('Date is not valid: ' + date);
			return;
		}
		identify({'!birthday': date});
	}

	function trackPlaceOrder() {
		if(arguments.length < 1) {
			return;
		}
		if(arguments.length === 1) {
			if(arguments[0] instanceof TdOrder) {
				track('!place_order', arguments[0]);
			} else {
				_log('object is not TdOrder');
			}
			return;
		}
		if(arguments.length < 3) {
			_log("arguments don't match function");
			return;
		}
		var name = arguments[0];
		var price = arguments[1];
		var currency = arguments[2];
		var quantity = arguments[3];
		var order = new TdOrder();
		order.setCurrency(currency);
		var product = new TdProduct();
		product.setName(name);
		product.setPrice(price);
		product.setCurrency(currency);
		var orderLines = [];
		var orderLine = new TdOrderLine();
		if(quantity) {
			orderLine.setQuantity(quantity);
		}
		orderLine.setProduct(product);
		orderLines.push(orderLine);
		order.setOrderLines(orderLines);
		track('!place_order', order);
	}

	function checkForInAppMessage(callback) {

		// FUNCTION SHOULD CALL API WITH CURRENT USER ID AND RETURN ANY INBOX MESSAGES
		var userId = options.userId || options.deviceId;
		var url = 'https://api.tongrd.com/v2/messages?user_id=' + userId;
		var appKey = options.appKey;
		
		// CHECK FOR REQUIRED userId
		if ( !userId ) { throw( 'Error: Missing User Id' ); return; }

		var async = true;
		if(options.async !== undefined && options.async !== null) {
			async = !!options.async;
		}
		var data = {};

		// TODO: DELETE, JUST FOR DEMO
		callback({
			"messages": [
			    {
				    "min_sdk": 30000,
				    "cid": 1,
				    "mid": 1,
				    "title": "MMMessage TTitle",
				    "message": "Message to appear in the body of the message. Get it Here!",
				    "image_url": "test-cover.jpg",
				    "display_time": 0,
				    "layout": "full",
				    "action": {
				      "text": "Click Here",
				      "type": "url",
				      "value": "http://www.tongdao.io"
				    },
				    // is only for full
				    "buttons": [],
				    "template": "<div id='td-message-11' class='td-message'><div id='td-message-cover' class='td-message-cover hidden' data-layout='full' data-display-time='0'><img src='test-cover.jpg' /><a id='td-message-button-0' class='td-message-button' href='http://tongdao.io' style='left: 40px; top: 100px; height: 50px; width: 50px;'></a><div id='td-close-icon' class='td-close-icon'></div></div></div>",
				    "style": "styles.css",
				    "script": "script.js"
				}
			]
		});
		return;
		// END DELETE

		new Request('GET', url, data, appKey, async).send(function(status, response) {
			try {
				if (status === 204 || status === 200) {
					if (callback) {
						// MAKE SURE RETURNING OBJECT NOT STRING
						callback( JSON.parse(response) );
					} else {
						return JSON.parse(response);
					};
				} else {
					_log(' Unable to Return messages');
				}
			} catch (e) {
				_log(' Unable to Get Messages: ' + e);
			}
		});
	}

	function displayInAppMessage(callback) {

		// FETCH MESSAGES DATA AND THEN CREATE AND ATTACH RETURNED MESSAGES
		checkForInAppMessage( function( data ) {
			// RETURN IF NO MESSAGES
			if (!data.messages.length) {
				if (callback) callback();
				return;
			}

			// LOOPS THROUGH MESSAGES WITH SLIGHT DELAY
			var messages = data.messages;
			var messageLength = messages.length;
			var counter = 0;
			var firstFull = true;

			// TODO: FOR MULTI-MESSAGE SUPPORT TURN THIS INTO FOR OR FOREACH LOOP
			(function displayMsg (count) {            
				// CREATE NEW tdMessage WITH CORRESPONDING DATA
				var tdMessage = new TdInAppMessage(messages[count]);

				// CHECK FOR CORRESPONDING POSITION'S MESSAGES WRAPPER AND CREATE IF NONE
				var tdWrapper = document.getElementById('td-wrapper-' + tdMessage.layout);
				if (!tdWrapper) {
					tdWrapper = document.createElement('div');
					tdWrapper.id = 'td-wrapper-' + tdMessage.layout;
					document.body.appendChild(tdWrapper);
					// CHECK FOR WRAPPER CSS, IF NONE INJECT CSS STYLE NODE
					tdMessage.createWrapperEl();
				}

				// CREATE MESSAGE ELEMENTS
				var messageEl = tdMessage.createMessageEl();

				// CREATE GLOBAL ACTIONS FOR WEBVIEW AND WRAPPER
				window.td_wv = {
					trackReceive: function(){
						tongdao.track('!receive_message', { '!message_id': tdMessage.mid, '!campaign_id': tdMessage.cid });
					},
					trackOpen: function(){
						tongdao.track('!open_message', { '!message_id': tdMessage.mid, '!campaign_id': tdMessage.cid });
					},
					closeMessage: function(){
						tdWrapper.removeChild(messageEl);
						document.body.removeChild(tdWrapper);
					}
				};

				// CHECK IF FIRST "full" LAYOUR MESSAGE > PREVENT MORE THAN ONE FROM ATTACHING
				if( tdMessage.layout!='full' || firstFull ) {
					if(tdMessage.layout=='full') firstFull = false;
					// PRELOAD IMAGES AND ATTACH MESSAGE TO DOM
					tdMessage.attachMessageEl(messageEl, tdWrapper);
				};
				
				// DELAY NEXT MESSAGE ATTACHMENT FOR BETTER UI
				count++;
				if (count<messageLength) {
					setTimeout(function () { 
						displayMsg(counter);
					}, 800);
				} else {
					if (callback) callback();
				}
			})(counter); 

		} );

	}

	return {
		runQueuedFunctions: runQueuedFunctions,
		init: init,
		track: track,
		setUserId: setUserId,
		setUserProperties: setUserProperties,
		setOptOut: setOptOut,
		setVersionName: setVersionName,
		setDomain: setDomain,
		setDeviceId: setDeviceId,
		identify: identify,
		identifyBirthday: identifyBirthday,
		identifyAvatar: identifyAvatar,
		identifyAge: identifyAge,
		identifyGender: identifyGender,
		identifyPhone: identifyPhone,
		identifyEmail: identifyEmail,
		identifyFullName: identifyFullName,
		trackPlaceOrder: trackPlaceOrder,
		displayInAppMessage: displayInAppMessage,
		checkForInAppMessage: checkForInAppMessage,
		sendEvents: sendEvents,
		__getOptions: function() {
			return options;
		},
		__getEvents: function() {
			return unsentEvents;
		}
	};
});