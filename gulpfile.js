var del = require('del');
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
var jshint = require('gulp-jshint');
const imagemin = require('gulp-imagemin');
var plumber = require('gulp-plumber');


// Temporary solution until gulp 4
// https://github.com/gulpjs/gulp/issues/355
var runSequence = require('run-sequence');


var BUILD_PATH = './public/assets';
var SOURCE_PATH = './app/assets';
var DEBUG_MODE = false;

gulp.task('default', function() {
  // place code for your default task here
});

/**
 * Compile and minify SASS files
 */
gulp.task('build:sass', function () {
    return gulp.src(SOURCE_PATH + '/sass/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(concat('main.min.css'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(BUILD_PATH + '/css'));
});

/**
 * Compile javascript files
 */
gulp.task('build:js', function () {
    return gulp.src(SOURCE_PATH + '/js/**/*.js')
        .pipe(sourcemaps.init())
        //.pipe(concat('main.min.js'))
        .pipe(plumber())
        .pipe(jshint({ /* this object represents the JSLint directives being passed down */ }))
        .pipe(jshint.reporter(require('jshint-stylish').reporter))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(plumber.stop())
        .pipe(gulp.dest(BUILD_PATH + '/js'));
});

gulp.task('build:images', function () {
    return gulp.src(SOURCE_PATH + '/images/*')
        .pipe(imagemin())
        .pipe(gulp.dest(BUILD_PATH + '/images'));
});

gulp.task('clean', function (cb) {
    return del([
        BUILD_PATH + '/css',
        BUILD_PATH + '/js',
        BUILD_PATH + '/images',
    ]);
});

gulp.task('build', function (cb) {
    return runSequence(
        ['clean'],
        ['build:sass',  'build:js', 'build:images'],
        cb
    );
});

gulp.task('watch', ['build'], function () {
    gulp.watch(SOURCE_PATH + '/sass/**/*.scss', ['build:sass']);
    gulp.watch(SOURCE_PATH + '/js/**/*.js', ['build:js']);
});

gulp.task('default', ['watch']);