var gulp = require('gulp');
var rjs = require('gulp-requirejs');
 
gulp.task('jsbuild', function() {
    rjs({
	baseUrl: './app',
	name: "TongDao",
	out: "build.js",
	findNestedDependencies: true,
    }).pipe(gulp.dest('./deploy/'));
});
