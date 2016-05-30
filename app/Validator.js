define(function() {

	var URL_REGEX = new RegExp(/^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/);
	var EMAIL_REGEX = new RegExp(/^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i);

	function validatePhone(phone) {
		phone = '' + phone;
		if(phone[0] === '+') {
			phone = phone.substring(1);
		}
		phone = phone.replace(/[^0-9.]/g, '');
		return phone.length > 10;
	}

	function validateDate(str) {
		str = str || '';
		var split = str.split('T');
		if(split.length !== 2) {
			return false;
		}
		var date = split[0];
		var time = split[1];
		var dates = date.split('-');
		if(dates.length !== 3) {
			return false;
		}
		var year = parseInt(dates[0]);
		var month = parseInt(dates[1]);
		var day = parseInt(dates[2]);
		if(Number.isNaN(year) || year < 0) {
			return false;
		}
		if(Number.isNaN(month) || month < 0 || month > 12) {
			return false;
		}
		if(Number.isNaN(day) || day < 0 || day > 31) {
			return false;
		}
		var times = time.replace(/Z/, '').split(':');
		if(times.length !== 3) {
			return false;
		}
		var hours = parseInt(times[0]);
		var minutes = parseInt(times[1]);
		var seconds = parseInt(times[2]);
		if(Number.isNaN(hours) || hours < 0 || hours > 24) {
			return false;
		}
		if(Number.isNaN(minutes) || minutes < 0 || minutes > 59) {
			return false;
		}
		if(Number.isNaN(seconds) || seconds < 0 || seconds > 59) {
			return false;
		}
		var d = new Date(str);
		if(Number.isNaN(d.getTime())) {
			return false;
		}
		return true;
	}

	function validateUrl(url) {
		return URL_REGEX.test(url);
	}

	function validateEmail(email) {
		return EMAIL_REGEX.test(email);
	}

	function validateAge(age) {
		age = parseInt(age);
		if(Number.isNaN(age) || age < 0) {
			return false;
		}
		return true;
	}

	function validageGender(gender) {
		gender = gender || '';
		return gender === 'male' || gender === 'female';
	}

	return {
		validageGender: validageGender,
		validateAge: validateAge,
		validateEmail: validateEmail,
		validateUrl: validateUrl,
		validateDate: validateDate,
		validatePhone: validatePhone
	};
});