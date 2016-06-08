var tongdao = require('../app/TongDao');
var cookie = require('../app/Cookie');
var TdOrder = require('../app/TdOrder');
var TdOrderLine = require('../app/TdOrderLine');
var TdProduct = require('../app/TdProduct');
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
		cookie.remove(tongdao.__getOptions().cookieName);
	});

	function assertInit(event) {
		expect(event.action).toBe('identify');
		expect(event.properties['!device']).toBeDefined();
	}

	function asserMergeEvent(event, userProperties) {
		expect(event.action).toBe('merge');
		for(var prop in userProperties) {
			if(!userProperties.hasOwnProperty(prop)) {
				continue;
			}
			expect(event[prop]).toBeDefined();
			expect(event[prop]).toBe(userProperties[prop]);
		}
	}

	function assertOpenApp(openAppEvent, openPageEvent) {
		expect(openAppEvent.action).toBe('track');
		expect(openPageEvent.action).toBe('track');
		expect(openAppEvent.event).toBeDefined();
		expect(openPageEvent.event).toBeDefined();
		expect(openAppEvent.event).toBe('!open_app');
		expect(openPageEvent.event).toBe('!open_page');
		expect(openAppEvent.properties['!name']).toBeDefined();
		expect(openAppEvent.properties['!started_at']).toBeDefined();
		expect(openPageEvent.properties['!name']).toBeDefined();
		expect(openAppEvent.properties['!name']).toBe(window.location.href);
		expect(openPageEvent.properties['!name']).toBe(window.location.href);
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

	function assertTrackPlaceOrderByOrder(order, event) {
		expect(event.action).toBe('track');
		expect(event.event).toBeDefined();
		expect(event.event).toBe('!place_order');
		expect(event.properties['!currency']).toBeDefined();
		expect(order['!currency']).toBe(event.properties['!currency']);
		expect(event.properties['!order_lines']).toBeDefined();
		expect(event.properties['!order_lines'].length).toBe(1);
		var eventOrderLine = event.properties['!order_lines'][0];
		var orderLine = order['!order_lines'][0];
		if(orderLine['!quantity']) {
			expect(orderLine['!quantity']).toBe(eventOrderLine['!quantity']);
		}
		expect(eventOrderLine['!product']).toBeDefined();
		var product = orderLine['!product'];
		var eventProduct = eventOrderLine['!product'];
		expect(product['!name']).toBe(eventProduct['!name']);
		expect(product['!price']).toBe(eventProduct['!price']);
		expect(product['!currency']).toBe(eventProduct['!currency']);
	}

	//events will be saved because they can not be sent.
	it('[init, identifyage, trackplaceorder]', function(done) {
		tongdao.init('APP_KEY');
		//wait for window.onload to get open_app/page event
		setTimeout(function() {
			expect(tongdao.__getEvents().length).toBe(3); // identify + open_app + open_page(on window load)
			tongdao.identifyAge(age);
			expect(tongdao.__getEvents().length).toBe(4); // + one more identify
			tongdao.trackPlaceOrder(name, price, currency);
			expect(tongdao.__getEvents().length).toBe(5); // + one more track
			done();
		}, 1);
	});
	it('[check added events]', function(done) {
		setTimeout(function() {
			expect(tongdao.__getEvents().length).toBe(5);
			var identify = tongdao.__getEvents()[0];
			var open_app = tongdao.__getEvents()[1];
			var open_page = tongdao.__getEvents()[2];
			var identifyAge = tongdao.__getEvents()[3];
			var trackPlaceOrder = tongdao.__getEvents()[4];
			assertInit(identify);
			assertOpenApp(open_app, open_page);
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
			expect(tongdao.__getEvents().length).toBe(2);
			var setUserIdEvent = tongdao.__getEvents()[0];
			asserMergeEvent(setUserIdEvent, {'previous_id': tongdao.__getOptions().deviceId});
			var ageEvent = tongdao.__getEvents()[1];
			expect(userId).toBe(ageEvent['user_id']);
			done();
		});
	});
	it('[setUserId:logout]', function(done) {
		tongdao.setUserId(null);
		tongdao.identify({gender: 'male'}, function() {
			expect(tongdao.__getEvents().length).toBe(4); // logout + identify + 2 events from login.
			var event = tongdao.__getEvents()[1];
			expect(event['user_id']).toBeDefined(); // deviceId used. Is it ok???
			done();
		});
	});
	it('[setDeviceId]', function(done) {
		var deviceId = 'deviceTongDao';
		tongdao.setDeviceId(deviceId);
		tongdao.identify({address: 'The City'}, function() {
			expect(tongdao.__getEvents().length).toBe(5); // identify + 4 from previous test
			var event = tongdao.__getEvents()[4];
			expect(deviceId).toBe(event['user_id']); // since deviceId is used if userId is not defined
			done();
		});
	});
	it('[setDeviceId:null]', function(done) {
		tongdao.setDeviceId(null);
		tongdao.identify({agent: 'Smith'}, function() {
			expect(tongdao.__getEvents().length).toBe(6); // identify + 4 from previous test
			var event = tongdao.__getEvents()[5];
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
	it('[trackPlaceOrder with object]', function() {
		var product1 = new TdProduct();
		product1.setName("E-reader");
		product1.setPrice((100.0).toFixed(2));
		var orderLine1 = new TdOrderLine();
		orderLine1.setProduct(product1);
		orderLine1.setQuantity(2);
		var orderLines = [];
		orderLines.push(orderLine1);
		var order = new TdOrder();
		order.setCurrency("CNY");
		order.setOrderId("abcdef");
		order.setTotal((200.0).toFixed(2));
		order.setOrderLines(orderLines);
		tongdao.trackPlaceOrder(order);
		expect(tongdao.__getEvents().length).toBe(1);
		var event = tongdao.__getEvents()[0];
		assertTrackPlaceOrderByOrder(order, event);
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