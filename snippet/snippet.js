(function(t, e) {
    var n = t.tongdao || {};
    var r = e.createElement('script');
    var _q = [];
    r.type = 'text/javascript';
    r.async = true;
    r.src = '##TONGDAO_JS_URL##';
    r.onload = function() {
        if(t.tongdao && t.tongdao.runQueuedFunctions) {
            t.tongdao.runQueuedFunctions(_q);
        }
    };

    var s = e.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(r, s);

    function c(t) {
        n[t] = function() {
            _q.push([t].concat(Array.prototype.slice.call(arguments, 0)));
        }
    }
    var l = ['init', 'track', 'setUserId', 'setUserProperties', 'setOptOut', 'setVersionName', 'setDomain', 
        'setDeviceId', 'identify', 'identifyBirthday', 'identifyAvatar', 'identifyAge', 'identifyGender',
        'identifyPhone', 'identifyEmail', 'identifyFullName', 'trackPlaceOrder'];
    for (var p = 0; p < l.length; p++) {
        c(l[p]);
    }
    t.tongdao = n;
})(window, document);

tongdao.init('YOUR-APP-KEY');