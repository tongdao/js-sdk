requirejs.config({
	paths:{
		'ua-parser-js': 'libs/ua-parser'
	}
});
require(['TongDao'], function(tongdao) {
	tongdao.init('6d8425f455a62da2de84a1f072215629');
});
