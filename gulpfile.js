var gulp = require('gulp');
var clean = require('gulp-clean');
var webserver = require('gulp-webserver');
var webpack = require('webpack');
var DIST_DIR = './build';
var OUTPUT_FILE = 'app.js';
var frontendConfig = {
	entry: './app/app.js',
	output: {
		path: DIST_DIR,
		filename: OUTPUT_FILE
	}
};

gulp.task('clean', function () {
	return gulp.src(DIST_DIR, {read: false})
		.pipe(clean());
});

gulp.task('build', ['clean'], function(done) {
	webpack(frontendConfig).run(function(err, stats) {
		if(err) {
			console.log('Error', err);
		} else {
			console.log(stats.toString());
		}
		done();
	});
});

gulp.task('test', ['build'], function() {
	gulp.src('./').pipe(webserver({
		path: '/',
		port: 8111,
		directoryListing: true,
		open: 'http://localhost:8111/test.html'
	}));
});
