var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify');
var uglify = require('gulp-uglify');
var insert = require('gulp-insert');
var concat = require('gulp-concat');
var buffer = require('vinyl-buffer');

var header = "/* chartjs-plugin-titleclick | AlbinoDrought | MIT License | https://github.com/AlbinoDrought/chartjs-plugin-title-click/blob/master/LICENSE */\n";
var outDir = './';

gulp.task('build', function() {
    var build = browserify('./src/chart.titleclick.js')
        .ignore('chart.js')
        .bundle()
        .pipe(source('chartjs-plugin-titleclick.js'))
        .pipe(buffer())
        .pipe(insert.prepend(header))
        .pipe(gulp.dest(outDir))
        // min build
        .pipe(streamify(uglify()))
        .pipe(insert.prepend(header))
        .pipe(streamify(concat('chartjs-plugin-titleclick.min.js')))
        .pipe(gulp.dest(outDir));

    return build;
});
