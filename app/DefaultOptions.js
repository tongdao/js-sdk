define(['Language'],function (language) {
	return {
		apiEndpoint: 'https://api.tongrd.com/v2/events',
		cookieExpirationDays: 365 * 5,
		cookieName: 'tongdao_id',
		domain: undefined,
		includeUtm: false,
		language: language.getLanguage(),
		optOut: false,
		platform: 'Web',
		savedMaxCount: 1000,
		sessionTimeout: 30 * 60 * 1000,
		unsentKey: 'tongdao_unsent',
		unsentIdentifyKey: 'tongdao_unsent_identify',
		uploadBatchSize: 100,
		batchEvents: false,
		eventUploadThreshold: 30,
		eventUploadPeriodMillis: 30 * 1000
	}
});