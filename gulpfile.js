const gulp = require('gulp')
const rollup = require('gulp-better-rollup')
const babel = require('rollup-plugin-babel')
const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')

const browsersync = require('browser-sync') // liveserver
const fileinclude = require('gulp-file-include') //импорт html с помощью @@
const del = require('del') // очищение папки
const autoprefixer = require('gulp-autoprefixer') // простановка префиксов
const group_media = require('gulp-group-css-media-queries') //группировка медиазапросов в конце файла
const clean_css = require('gulp-clean-css') // минификация css
const cssimport = require('gulp-cssimport') //импорт в css

const inlinesource = require('gulp-inline-source') //сборка в один файл
const replace = require('gulp-replace') //замена строк в файле

const distFolder = 'dist'
const sourceFolder = 'src'
const deployFolder = 'deploy'

let path = {
  build: {
    html: distFolder + '/',
    css: distFolder + '/',
    js: distFolder + '/',
  },
  src: {
    html: sourceFolder + '/index.html',
    css: sourceFolder + '/index.css',
    js: sourceFolder + '/index.js',
  },
  watch: {
    html: sourceFolder + '/**/*.html',
    css: sourceFolder + '/**/*.css',
    js: sourceFolder + '/**/*.js',
  },
  cleanDist: './' + distFolder + '/',
  cleanDeploy: './' + deployFolder + '/',
  deploy: deployFolder + '/',
  bundle: distFolder + '/index.html',
}

function browserSync(params) {
  browsersync.init({
    server: {
      baseDir: './' + distFolder + '/',
    },
    port: 3000,
    notify: false,
  })
}

function html() {
  return gulp
    .src(path.src.html)
    .pipe(
      fileinclude({
        prefix: '@@',
        basepath: '@file',
      }),
    )
    .pipe(gulp.dest(path.build.html))
    .pipe(browsersync.stream())
}

function css() {
  return (
    gulp
      .src(path.src.css)
      .pipe(cssimport())
      .pipe(group_media())
      .pipe(
        autoprefixer({
          overrideBrowserlist: ['last 5 versions'],
          cascade: true,
        }),
      )
      //   .pipe(clean_css()) // минификация css
      .pipe(gulp.dest(path.build.css))
      .pipe(browsersync.stream())
  )
}

function js() {
  return gulp
    .src(path.src.js)
    .pipe(rollup({ plugins: [babel(), resolve(), commonjs()] }, 'umd'))
    .pipe(gulp.dest(path.build.js))
    .pipe(browsersync.stream())
}

function watchFiles() {
  gulp.watch([path.watch.html], html)
  gulp.watch([path.watch.css], css)
  gulp.watch([path.watch.js], js)
}

function bundle() {
  return gulp
    .src(path.bundle)
    .pipe(
      inlinesource({
        compress: false,
      }),
    )
    .pipe(gulp.dest(path.deploy))
}

function cleanDist() {
  return del(path.cleanDist)
}

function cleanDeploy() {
  return del(path.cleanDeploy)
}

async function replaceFuncNames() {
  return gulp
    .src(path.deploy + '/index.html')
    .pipe(replace('Scripts', '<%= Scripts%>'))
    .pipe(gulp.dest(path.deploy))
}

async function deleteImport() {
  return gulp
    .src(path.src.js)
    .pipe(replace('import Scripts', '//import Scripts'))
    .pipe(gulp.dest(sourceFolder))
}

async function returnImport() {
  return gulp
    .src(path.src.js)
    .pipe(replace('//import Scripts', 'import Scripts'))
    .pipe(gulp.dest(sourceFolder))
}

const build = gulp.series(cleanDist, gulp.parallel(html, css, js))
const watch = gulp.parallel(build, watchFiles, browserSync)
const deploy = gulp.series(deleteImport, build, cleanDeploy, bundle, replaceFuncNames, returnImport)

exports.build = build
exports.deploy = deploy
exports.watch = watch
exports.default = watch
