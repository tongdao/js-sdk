define(function() {
	return {
		apiEndpoint: 'https://api.tongrd.com/v2/events',
		cookieExpirationDays: 365 * 5,
		cookieName: 'tongdao_id',
		domain: undefined,
		includeUtm: false,
		language: require('./Language').getLanguage(),
		optOut: false,
		platform: 'Web',
		sessionTimeout: 30 * 60 * 1000,
		unsentKey: 'tongdao_unsent',
		unsentIdentifyKey: 'tongdao_unsent_identify',
		uploadBatchSize: 100,
		eventUploadThreshold: 30,
		eventUploadPeriodMillis: 30 * 1000
	}
});