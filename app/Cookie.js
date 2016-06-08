define(["./base64"], function(base64) {

	var _options = {};
	function options() {
		return _options;
	}

	function _topDomain(domain) {
		var split = domain.split('.');
		if(split.length < 2) {
			return domain;
		}
		return domain.split('.').slice(-2).join('.');
	}


	function init(opts) {
		_options.expirationDays = opts.expirationDays || _options.expirationDays;
		var domain = (opts.domain !== undefined) ? opts.domain : '.' + _topDomain(window.location.href);
		_options.domain = domain || null;
	}

	function get(name) {
		try {
			var matches = document.cookie.match(new RegExp(
				"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"));
			var value = matches ? decodeURIComponent(matches[1]) : undefined;
			if (value) {
				return JSON.parse(base64.decode(value));
			}
			return null;
		} catch (e) {
			return null;
		}
	};


	function set(name, value) {
		try {
			_set(name, base64.encode(JSON.stringify(value)));
		} catch (e) {
		}
	}


	function _set(name, value) {
		var expires = value !== null ? options.expirationDays : -1 ;
		if (expires) {
			var date = new Date();
			date.setTime(date.getTime() + (expires * 24 * 60 * 60 * 1000));
			expires = date;
		}
		var cookie = name + '=' + value;
		if (expires) {
			cookie += '; expires=' + expires.toUTCString();
		}
		cookie += '; path=/';
		if (options.domain) {
			cookie += '; domain=' + options.domain;
		}
		document.cookie = cookie;
	}

	function remove(name) {
		try {
			_set(name, null);
		} catch (e) {
		}
	}


	return {
		options: options,
		get: get,
		set: set,
		remove: remove,
		init: init
	};
});
