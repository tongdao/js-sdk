module.exports = function(config) {
	config.set({
		frameworks: ['jasmine'],
		files: [
			'tests/*.js'
		],
		preprocessors: {
			'tests/*.js': ['webpack']
		},
		reporters: ['progress'],
		port: 9876,
		colors: true,
		logLevel: config.LOG_INFO,
		browsers: ['Chrome'],
		singleRun: true
	});
};