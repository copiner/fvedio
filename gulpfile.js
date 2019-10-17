const { src, dest, task, series, parallel, watch, lastRun } = require('gulp');

const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const htmlmin = require('gulp-htmlmin');
const imagemin = require('gulp-imagemin');
const gulpif = require('gulp-if');
const sass = require('gulp-sass');
const plumber = require('gulp-plumber');

const connect = require('gulp-connect');
const proxy = require('http-proxy-middleware');//反向代理
const fileinclude = require('gulp-file-include');
const del = require('del');

// NODE_ENV
var env = process.env.NODE_ENV || 'development';
var condition = env === 'production';


task('css', function (cb) {
    src('src/sass/*.scss')
    .pipe(plumber())
    .pipe(sass().on('error', sass.logError))
    .pipe(gulpif(condition, cleanCSS()))
    .pipe(dest('app/css'))
    .pipe(connect.reload());
    cb();
});

task('html', function (cb) {
    src('src/vue/*.html')
    .pipe(plumber())
    .pipe(fileinclude({
        prefix: '@@',
        basepath: '@file'
      }))
    .pipe(gulpif(condition, htmlmin()))
    .pipe(dest('app/vue'))
    .pipe(connect.reload());
    cb();
});

task('js', function (cb) {
    src('src/js/*.js')
    .pipe(plumber())
    .pipe(gulpif(condition, uglify()))
    .pipe(dest('app/js'))
    .pipe(connect.reload());
    cb();
});


task('vedio', function (cb) {
  src('src/vedio/*')
  .pipe(dest('app/vedio'));
  cb();
})

task('config', function (cb) {
  src('src/config/*')
  .pipe(dest('app/config'));
  cb();
})

task('image', function (cb) {
    src('src/imgs/*')
    .pipe(plumber())
    .pipe(gulpif(condition, imagemin()))
    .pipe(dest('app/imgs'));
    cb();
});


task('watch', function(cb){//监控

  let watcher = watch(
    ['./src/js/*.js','./src/scss/*.scss','./src/vue/*.html'],
    {events:['change','add','unlink']},
    parallel('css','js','html')
  );

  watcher.on('change', function(path, stats) {
    console.log(`
      ------------------------
      File ${path} was changed
      ------------------------
      `);
  });

  watcher.on('add', function(path, stats) {
    console.log(`
      ----------------------
      File ${path} was added
      ----------------------
      `);
  });

  watcher.on('unlink', function(path, stats) {
    console.log(`
      ------------------------
      File ${path} was removed
      ------------------------
      `);
  });

  //watcher.close();
  cb();
});


task('clean', () => {
  return del('./app').then(() => {
    console.log(`
        -----------------------------
          clean tasks are successful
        -----------------------------`);
  }).catch((e) =>{
    console.log(e);
  })
});


//生成环境
task('build', series('clean', parallel('config','vedio','css','js','image','html'),function(cb){
  console.log(`
      -----------------------------
        build tasks are successful
      -----------------------------`);
      cb();
}));

//开发环境
task('server',series('clean','watch',parallel('config','vedio','css','js','image','html'),function(){
    connect.server({
        root: 'app',
        host:'192.168.1.77',
        port: 3000,
        livereload: true,
        middleware: function(connect, opt) {
            return [
                proxy('/api',  {
                    target: 'http://192.168.23.142:8089/gateway',
                    changeOrigin:true,
                    headers: {
                         "Connection": "keep-alive"
                     },
                    //ws: true,
                    pathRewrite: {
                        '^/api' : ''
                    },
                    router: {
                      // 'integration.localhost:3000' : 'http://localhost:8001',  // host only
                      // 'staging.localhost:3000'     : 'http://localhost:8002',  // host only
                      // 'localhost:3000/api'         : 'http://localhost:8003',  // host + path
                      // '/rest'                      : 'http://localhost:8004'   // path only
                    }
                })
            ]
        }

    });
    console.log(`
        -----------------------------
          server tasks are successful
        -----------------------------`);
}));

task('default', () => {
  console.log(
   `
  Build Setup
    开发环境： npm run start
    生产环境： npm run build
    `
  )
})
