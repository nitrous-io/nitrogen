var gulp = require('gulp'),
    eslint = require('gulp-eslint');

var srcPaths = ['lib/**/*.+(js|jsx|es6)', 'spec/**/*.+(js|jsx|es6)']

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

function lintJS() {
  return gulp.src(srcPaths)
    .pipe(eslint())
    .pipe(eslint.format());
}
