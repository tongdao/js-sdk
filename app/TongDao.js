define(['./DefaultOptions', './Cookie', './uuid', './libs/ua-parser', './Request', './Validator', './TdOrder', './TdOrderLine', './TdProduct'],
function(DEFAULT_OPTIONS, Cookie, UUID, UAParser, Request, Validator, TdOrder, TdOrderLine, TdProduct) {
	var IDENTIFY_EVENT = 'identify';
	var TRACK_EVENT = 'track';
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
			var newUser = !!options.deviceId || true;
			options.deviceId = (opt_config && opt_config.deviceId) || options.deviceId || UUID();
			options.userId = opt_userId || options.userId || null;
			options.cookieId = options.cookieId || options.deviceId;
			_saveCookieData();
		} catch (e) {
			_log('Error on init:' + e);
		}
		if (newUser) {
			var eventProperties = {
				'!device':{
					'!os_name': ua.os.name || null,
					'!os_version': ua.os.version || null,
					'!language': options.language,
					'!model': ua.device.model || null
				},
				'!fingerprint': {
					'!gaid': options.cookieId
				}
			}
			_logEvent(IDENTIFY_EVENT, null, eventProperties, callback);
		}
		window.onload = function() {
			_openPage();
		}
	}

	function _openPage() {
		options.startedAt = new Date().toISOString();
		options.openedPath = window.location.href;
		var eventProperties = {
			"!name": options.openedPath
		};
		track('!open_page', eventProperties);
		window.onbeforeunload = function () {
			_closePage(options.openedPath, options.startedAt);
		};
	}

	function _closePage(pathname, startedAt) {
		options.async = false;
		var eventProperties = {
			"!name": pathname,
			"!started_at": startedAt
		};
		track('!close_page', eventProperties);
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

	function _logEvent(action, eventType, eventProperties, callback) {
		if (eventProperties && typeof eventProperties !== 'object' ) {
			throw new Error('Track Event ' + eventType + ': properties not an object');
		}
		if (typeof callback !== 'function') {
			callback = null;
		}
		if (!action || options.optOut) {
			if (callback) {
				callback(0, 'No request sent');
			}
			return;
		}
		try {
			var timestamp = new Date().toISOString();
			eventProperties = eventProperties || {};
			var data = {
				action: action,
				user_id: options.userId || options.deviceId,
				properties: eventProperties,
				timestamp: timestamp
			}
			if (eventType) {
				data.event = eventType;
			}
			_setUnsentEvents(data);
			sendEvents(callback);
		} catch (e) {
			_log( '_logEvent: ' + e);
		}
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
		new Request(url, data, appKey, async).post(function(status, response) {
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
			options.userId = userId || null;
			_saveCookieData();
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

	function identify(userProperties, callback) {
		_logEvent(IDENTIFY_EVENT, null, userProperties, callback);
	}

	function track(eventType, eventProperties, callback) {
		return _logEvent(TRACK_EVENT, eventType, eventProperties, callback);
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
		sendEvents: sendEvents,
		__getOptions: function() {
			return options;
		},
		__getEvents: function() {
			return unsentEvents;
		}
	};
});