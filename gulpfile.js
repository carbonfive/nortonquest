const gulp = require('gulp');
const filter = require('gulp-filter');
const babel = require('gulp-babel');
const sass = require('gulp-sass');
const webpack = require('webpack');

const webpackConfig = require('./webpack.config.js');

gulp.task('default', function() {
  const jsFilter = filter(['**/*.js'], { restore: true });

  webpack(webpackConfig, function(error, stats) {
    if(error) {
      console.log(error);
    }
  });

  return gulp
    .src('./src/**/*.@(js|jade)')
    .pipe(jsFilter)
    .pipe(babel())
    .pipe(jsFilter.restore)
    .pipe(gulp.dest('./lib'));
});
