'use strict';

var gulp = require('gulp'),
    eslint = require('gulp-eslint'),
    babel = require('gulp-babel'),
    uglify = require('gulp-uglify'),
    sequence = require('gulp-sequence'),
    rename = require('gulp-rename'),
    del = require('del');

var srcPaths = ['lib/**/*.+(js|jsx|es6)', 'spec/**/*.+(js|jsx|es6)'];

gulp.task('default', ['lint-dev']);

gulp.task('lint-dev', function() {
  gulp.start('lint');

  gulp.watch(srcPaths).on('change', function() {
    gulp.start('lint');
  });
});

gulp.task('lint', function() {
  return lintJS();
});

gulp.task('build', sequence('clean', 'build-js', 'copy-resources', 'copy-readme'));

gulp.task('clean', function(cb) {
  del(['build/**', '!build']).then(function() {
    cb();
  });
});

gulp.task('build-js', function() {
  return gulp.src('lib/**/*.+(js|jsx|es6)')
    .pipe(babel({
      optional: ['es7.classProperties'],
      compact: true,
      modules: 'common'
    }))
    .pipe(uglify())
    .pipe(gulp.dest('build/lib'));
});

gulp.task('copy-resources', function() {
  return gulp.src([
    'keymaps/**/*',
    'lib/**/*.!(js|jsx|es6)',
    'menus/**/*',
    'nsync/**/*',
    'resources/**/*',
    'styles/**/*',
    'CHANGELOG.md',
    'LICENSE',
    'THIRD-PARTY-LICENSES',
    'package.json'
  ], { base: './' })
    .pipe(gulp.dest('build'));
});

gulp.task('copy-readme', function() {
  return gulp.src('README-dist.md')
    .pipe(rename('README.md'))
    .pipe(gulp.dest('build'));
});

function lintJS() {
  return gulp.src(srcPaths)
    .pipe(eslint())
    .pipe(eslint.format());
}
