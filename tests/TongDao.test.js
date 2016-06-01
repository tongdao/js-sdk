var tongdao = require('../app/TongDao');
describe('TongDao tests.', function() {

	var name = 'VIP Package';
	var price = 10.0;
	var currency = 'CNY';
	var quantity = 50;
	var age = 50;
	var birthDay = '1990-01-01T10:00:00Z';
	var avatar = 'http://example.com/my_avatar.png';
	var maleGender = 'male';
	var femaleGender = 'female';
	var phone = '+79991122345';
	var email = 'example@example.com';
	var fullName = 'Tong Dao';
	var BAD_API_ENDPOINT = 'http://localhost:8888/some_failed_url';
	//[hack]this endpoint just returns 200, that's all we need as mock api.
	var GOOD_API_ENDPOINT = 'http://localhost:8888/'

	// url of karma server, it is used not to start another webserver.
	beforeEach(function() {
		tongdao.__getOptions().apiEndpoint = BAD_API_ENDPOINT;
		tongdao.__getOptions().async = false;
		tongdao.__getOptions().uploadBatchSize = 10;
	});

	function assertInit(event) {
		expect(event.action).toBe('identify');
		expect(event.properties['!device']).toBeDefined();
		expect(event.properties['!fingerprint']).toBeDefined();
	}

	function assertOpenPage(event) {
		expect(event.action).toBe('track');
		expect(event.event).toBeDefined();
		expect(event.event).toBe('!open_page');
		expect(event.properties['!name']).toBeDefined();
		expect(event.properties['!name']).toBe(window.location.href);
	}

	function assertIdentifyFunc(prop, value, event) {
		expect(event.action).toBe('identify');
		expect(event.properties[prop]).toBeDefined();
		expect(event.properties[prop]).toBe(value);
	}

	function assertTrackPlaceOrderByParams(name, price, currency, quntity, event) {
		expect(event.action).toBe('track');
		expect(event.event).toBeDefined();
		expect(event.event).toBe('!place_order');
		expect(event.properties['!currency']).toBeDefined();
		expect(event.properties['!currency']).toBe(currency);
		expect(event.properties['!order_lines']).toBeDefined();
		expect(event.properties['!order_lines'].length).toBe(1);
		var orderLine = event.properties['!order_lines'][0];
		if(quntity) {
			expect(orderLine['!quantity']).toBeDefined();
			expect(orderLine['!quantity']).toBe(quantity);
		}
		expect(orderLine['!product']).toBeDefined();
		var product = orderLine['!product'];
		expect(product['!name']).toBe(name);
		expect(product['!price']).toBe(price);
		expect(product['!currency']).toBe(currency);
	}

	//events will be saved because they can not be sent.
	it('[init, identifyage, trackplaceorder]', function(done) {
		tongdao.init('APP_KEY');
		//wait for window.onload to get open_page event
		setTimeout(function() {
			expect(tongdao.__getEvents().length).toBe(2); // identify + open_page(on window load)
			tongdao.identifyAge(age);
			expect(tongdao.__getEvents().length).toBe(3); // + one more identify
			tongdao.trackPlaceOrder(name, price, currency);
			expect(tongdao.__getEvents().length).toBe(4); // + one more track
			done();
		}, 1);
	});
	it('[check added events]', function(done) {
		setTimeout(function() {
			expect(tongdao.__getEvents().length).toBe(4);
			var identify = tongdao.__getEvents()[0];
			var open_app = tongdao.__getEvents()[1];
			var identifyAge = tongdao.__getEvents()[2];
			var trackPlaceOrder = tongdao.__getEvents()[3];
			assertInit(identify);
			assertOpenPage(open_app);
			assertIdentifyFunc('!age', age, identifyAge);
			assertTrackPlaceOrderByParams(name, price, currency, null, trackPlaceOrder);
			done();
		});
	});
	it('[send saved events]', function(done) {
		tongdao.__getOptions().apiEndpoint = GOOD_API_ENDPOINT;
		tongdao.identify({gender: 'male', age: age}, function() {
			expect(tongdao.__getEvents().length).toBe(0);
			done();
		});
	});
	it('[setUserId:login]', function(done) {
		var userId = 'userTongDao';
		tongdao.setUserId(userId);
		tongdao.identify({age: age}, function() {
			expect(tongdao.__getEvents().length).toBe(1);
			var event = tongdao.__getEvents()[0];
			expect(userId).toBe(event['user_id']);
			done();
		});
	});
	it('[setUserId:logout]', function(done) {
		tongdao.setUserId(null);
		tongdao.identify({gender: 'male'}, function() {
			expect(tongdao.__getEvents().length).toBe(2);
			var event = tongdao.__getEvents()[1];
			expect(event['user_id']).toBeDefined(); // deviceId used. Is it ok???
			done();
		});
	});
	it('[setDeviceId]', function(done) {
		var deviceId = 'deviceTongDao';
		tongdao.setDeviceId(deviceId);
		tongdao.identify({address: 'The City'}, function() {
			expect(tongdao.__getEvents().length).toBe(3);
			var event = tongdao.__getEvents()[2];
			expect(deviceId).toBe(event['user_id']); // since deviceId is used if userId is not defined
			done();
		});
	});
	it('[setDeviceId:null]', function(done) {
		tongdao.setDeviceId(null);
		tongdao.identify({agent: 'Smith'}, function() {
			expect(tongdao.__getEvents().length).toBe(4);
			var event = tongdao.__getEvents()[3];
			expect(null).toBe(event['user_id']);
			tongdao.setDeviceId('UUID');
			done();
		});
	});
	it('[other identify* functions]', function() {
		tongdao.identifyBirthday(birthDay);
		tongdao.identifyAvatar(avatar);
		tongdao.identifyGender(femaleGender);
		tongdao.identifyPhone(phone);
		tongdao.identifyEmail(email);
		tongdao.identifyFullName(fullName);
		expect(tongdao.__getEvents().length).toBe(10);
		var events = tongdao.__getEvents();
		assertIdentifyFunc('!birthday', birthDay, events[4]);
		assertIdentifyFunc('!avatar', avatar, events[5]);
		assertIdentifyFunc('!gender', femaleGender, events[6]);
		assertIdentifyFunc('!phone', phone, events[7]);
		assertIdentifyFunc('!email', email, events[8]);
		assertIdentifyFunc('!name', fullName, events[9]);
	});
	it('[sendEvents]', function(done) {
		tongdao.__getOptions().apiEndpoint = GOOD_API_ENDPOINT;
		tongdao.sendEvents(function() {
			expect(tongdao.__getEvents().length).toBe(0);
			done();
		});
	});
	it('[limiting batched events queue]', function() {
		var numEvents = parseInt(tongdao.__getOptions().uploadBatchSize + (Math.random() * tongdao.__getOptions().uploadBatchSize + 1));
		for(var i = 0; i < numEvents; i++) {
			tongdao.identify({checking: 'limit'});
		}
		expect(tongdao.__getEvents().length).toBe(tongdao.__getOptions().uploadBatchSize);
		tongdao.identify({checking: 'limit'});
		expect(tongdao.__getEvents().length).toBe(tongdao.__getOptions().uploadBatchSize);
	});
});