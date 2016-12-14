var gulp = require('gulp');
var clean = require('gulp-clean');
var cleanCSS = require('gulp-clean-css');
var webserver = require('gulp-webserver');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var webpack = require('webpack');
var Server = require('karma').Server;
var KARMA_CONFIG = '/karma.conf.js';
var DIST_DIR = './build';
var OUTPUT_FILE = 'tongdao';
var SNIPPET_FILE = 'tongdao-snippet';
var SCRIPT_FILE = 'td_wv-script';
var STYLES_FILE = 'td_wv-styles';

function filename(name, min) {
	return name + (min ? '.min' : '') + '.js';
}
var devConfig = {
	entry: './app/app.js',
	output: {
		path: DIST_DIR,
		filename: filename(OUTPUT_FILE, false)
	}
};
var minConfig = {
	entry: './app/app.js',
	output: {
		path: DIST_DIR,
		filename: filename(OUTPUT_FILE, true)
	},
	plugins: [new webpack.optimize.UglifyJsPlugin()]
};

function build(config, done) {
	webpack(config).run(function(err, stats) {
		if(err) {
			console.log('Error', err);
		}
		done();
	});
}

gulp.task('clean', function () {
	return gulp.src(DIST_DIR, {read: false})
		.pipe(clean());
});

gulp.task('build', ['clean', 'build-min', 'build-snippet', 'build-components'], function(done) {
	build(devConfig, done);
});

gulp.task('build-min', ['clean'], function(done) {
	build(minConfig, done);
});

gulp.task('build-snippet', ['clean'], function() {
	gulp.src('snippet/snippet.js')
		.pipe(rename(filename(SNIPPET_FILE, false)))
		.pipe(gulp.dest(DIST_DIR));
	gulp.src('snippet/snippet.js')
		.pipe(rename(filename(SNIPPET_FILE, true)))
		.pipe(uglify())
		.pipe(gulp.dest(DIST_DIR));
});

gulp.task('build-components', ['clean'], function() {
	gulp.src('components/script.js')
		.pipe(rename(filename(SCRIPT_FILE, false)))
		.pipe(gulp.dest(DIST_DIR));
	gulp.src('components/script.js')
		.pipe(rename(filename(SCRIPT_FILE, true)))
		.pipe(uglify())
		.pipe(gulp.dest(DIST_DIR));
	gulp.src('components/styles.css')
		.pipe(rename(STYLES_FILE + '.css'))
		.pipe(cleanCSS({compatibility: 'ie8'}))
		.pipe(gulp.dest(DIST_DIR));
});

gulp.task('test-snippet', ['build'], function() {
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
	}, function(result) {
		if(result === 1) {
			done('Tests failed. Code: ' + result);
		} else {
			done();
		}
	}).start();
});