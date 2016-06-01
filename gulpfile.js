var gulp = require('gulp');
var clean = require('gulp-clean');
var webserver = require('gulp-webserver');
var webpack = require('webpack');
var Server = require('karma').Server;
var KARMA_CONFIG = '/karma.conf.js';
var DIST_DIR = './build';
var OUTPUT_FILE = 'tongdao.js';
var MIN_FILE = 'tongdao.min.js';
var devConfig = {
	entry: './app/app.js',
	output: {
		path: DIST_DIR,
		filename: OUTPUT_FILE
	}
};
var minConfig = {
	entry: './app/app.js',
	output: {
		path: DIST_DIR,
		filename: MIN_FILE
	},
	plugins: [new webpack.optimize.UglifyJsPlugin()]
};

function build(config, done) {
	webpack(config).run(function(err, stats) {
		if(err) {
			console.log('Error', err);
		} else {
			console.log(stats.toString());
		}
		done();
	});
}

gulp.task('clean', function () {
	return gulp.src(DIST_DIR, {read: false})
		.pipe(clean());
});

gulp.task('build', ['clean'], function(done) {
	build(devConfig, done);
});

gulp.task('build-min', ['clean'], function(done) {
	build(minConfig, done);
});

gulp.task('test', ['build'], function() {
	gulp.src('./').pipe(webserver({
		path: '/',
		port: 8111,
		directoryListing: true,
		open: 'http://localhost:8111/test.html'
	}));
});

gulp.task('tests', function (done) {
	new Server({
		port: 8888,
		configFile: __dirname + KARMA_CONFIG
	}, done).start();
});