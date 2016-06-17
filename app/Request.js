define(function() {

	var Request = function(url, data, appKey, async) {
		this.url = url;
		this.data = data || {};
		this.appKey = appKey;
		this.async = async;
	};

	Request.prototype.post = function(callback) {
		var isIE = window.XDomainRequest ? true : false;
		var data = JSON.stringify(this.data);
		if (isIE) {
			var xdr = new window.XDomainRequest();
			xdr.open('POST', this.url, this.async);
			xdr.onload = function() {
				callback(200, xdr.responseText);
			};
			xdr.onerror = function () {
				if (xdr.responseText === 'Request Entity Too Large') {
					callback(413, xdr.responseText);
				} else {
					callback(500, xdr.responseText);
				}
			};
			xdr.ontimeout = function () {};
			xdr.onprogress = function() {};
			xdr.send(data);
		} else {
			var xhr = new XMLHttpRequest();
			xhr.open('POST', this.url, this.async);
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4) {
					callback(xhr.status, xhr.responseText);
				}
			};
			xhr.setRequestHeader('X-APP-KEY', this.appKey);
			xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
			xhr.send(data);
		}
	}
	return Request;
});
