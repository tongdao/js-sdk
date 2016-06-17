define(function() {
	return {
		getLanguage: function getLanguage() {
			return (navigator && ((navigator.languages && navigator.languages[0]) ||
				navigator.language || navigator.userLanguage)) || undefined;
		}
	};
});
