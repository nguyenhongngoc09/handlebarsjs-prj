const assemble = require('assemble');
const watch = require('base-watch');
const gulpLoadPlugins = require('gulp-load-plugins');
const handlebarHelpers = require('handlebars-helpers')();
const browserSync = require('browser-sync').create();
const del = require('del');
const extname = require('gulp-extname');
const wiredep = require('wiredep').stream;
const argv = require('minimist')(process.argv.slice(2));
const concat = require('gulp-concat');
const inlinesource = require('gulp-inline-source');
const gnf = require('gulp-npm-files');
const rename = require('gulp-rename');
const tap = require('gulp-tap');
const path = require('path');
const gulpFile = require('gulp-file');

let configPath = '';
let jsConfigPath = '';
let scssConfigPath = '';
const contentsFolder = './app/contents';

if (['localhost', 'staging', 'production'].indexOf(argv.env) > -1) {
  configPath = './app/contents/'+ argv.env +'/config.json';
  jsConfigPath = 'app/scripts/data/'+ argv.env +'/data.js';
  scssConfigPath = 'app/styles/config/'+ argv.env +'/';
} else {
  configPath = './app/contents/production/config.json';
  jsConfigPath = 'app/scripts/data/production/data.js';
  scssConfigPath = 'app/styles/config/production/';
}

const config = require(configPath);
const app = assemble();
const $ = gulpLoadPlugins();

app.use(watch());

app.task('styles', () => {
  return app.src(['app/styles/*.scss', 'app/styles/components/*.scss'])
      .pipe($.plumber())
      .pipe($.sourcemaps.init())
      .pipe($.sass.sync({
        outputStyle: 'expanded',
        precision: 10,
        includePaths: ['.', scssConfigPath]
      }).on('error', $.sass.logError))
      .pipe($.autoprefixer({browsers: ['> 1%', 'last 2 versions', 'Firefox ESR', 'ie >= 10']}))
      // .pipe($.sourcemaps.write())
      .pipe(app.dest('.tmp/styles'))
      .pipe(app.dest('dist/styles'))
      .pipe(browserSync.stream());
});

app.task('scripts', () => {
  return app.src([jsConfigPath, 'app/scripts/*.js'])
      .pipe($.plumber())
      .pipe($.sourcemaps.init())
      .pipe($.babel())
      // .pipe($.sourcemaps.write('.'))
      .pipe(app.dest('.tmp/scripts'))
      .pipe(app.dest('dist/scripts'))
      .pipe(browserSync.stream());
});

app.task('npm-files', () => {
  return app.src([
    'node_modules/jquery/dist/jquery.min.js',
    'node_modules/slick-carousel/slick/*.*',
    'node_modules/bootstrap-sass/assets/javascripts/bootstrap.min.js'
  ])
  .pipe($.plumber())
  .pipe(app.dest('.tmp/npm-dep'))
  .pipe(app.dest('dist/npm-dep'));
});

function lint(files, options) {
  return app.src(files)
    .pipe(reload({stream: true, once: true}))
    .pipe($.eslint(options))
    .pipe($.eslint.format())
    .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
}

function processArray(property, sourcePathParts) {
  return property.map((subProperty) => {
    let resultProperty = subProperty
    for(let i = 0; i < sourcePathParts.length; i++) {
      resultProperty = resultProperty[sourcePathParts[i]];
    }
    resultProperty.stampTime = getTimeStamp();
    return resultProperty;
  });
}

function getTimeStamp() {
  const nowDate = new Date();
  const nowYear = ("0000" + (nowDate.getFullYear().toString())).slice(-4);
  const nowMonth = ("00" + ((nowDate.getMonth() + 1).toString())).slice(-2);
  const nowDay = ("00" + ((nowDate.getDate()).toString())).slice(-2);
  const nowHours = ("00" + (nowDate.getHours().toString())).slice(-2);
  const nowMinutes = ("00" + (nowDate.getMinutes().toString())).slice(-2);
  const nowSeconds = ("00" + (nowDate.getSeconds().toString())).slice(-2);

  var nowTime = 'T' + nowHours + nowMinutes + nowSeconds;

  var now = nowYear + nowMonth + nowDay + nowTime;

  return now;
}

app.task('lint', () => {
  return lint('app/scripts/*.js', {
    fix: true
  })
  .pipe(app.dest('app/scripts'));
});

app.task('html', ['styles', 'scripts', 'npm-files', 'assemble'], () => {
  return app.src('.tmp/*.html')
      .pipe($.useref({searchPath: ['.tmp', 'app', '.']}))
      .pipe($.if('*.js', $.beautify()))
      .pipe($.if('*.css', $.cssbeautify()))
      .pipe(inlinesource({
          compress: false
      }))
      // .pipe($.if('*.html',
      //   $.replace(/(src|href)=\"(scripts|styles)/g, '$1="'+ config.asset_url +'$2')
      // ))
      // .pipe($.if('*.html', $.htmlmin({collapseWhitespace: true})))
      .pipe(app.dest('dist'));
});

app.task('json', () => {
  return app.src('.tmp/**/*.json')
      .pipe($.beautify())
      .pipe(app.dest('dist'));
});

app.task('ics', () => {
  return app.src('.tmp/**/*.ics')
      .pipe(app.dest('dist'));
});

app.task('includes', () => {
  return app.src('app/includes/**/*')
      .pipe(app.dest('.tmp/includes'))
      .pipe(app.dest('dist/includes'));
});

app.task('assemble', () => {
  app.partials('app/handlebars/partials/**/*.hbs');
  app.layouts('app/handlebars/layouts/**/*.hbs');
  app.data(configPath);
  app.data('app/contents/data/*.json');
  const outputDir = '.tmp'

  return app.src('app/contents/*.json')
    .pipe(tap((file) => {
      const fileName = path.basename(file.path);
      const fileJson = require(file.path);
      const templateFile = fileJson.layout.template;
      const pageLocation = `${outputDir}${path.dirname(fileJson.sitemap.loc)}`;
      const htmlFileName = path.parse(path.basename(fileJson.sitemap.loc)).name;

      if (fileJson.dataLinks && fileJson.dataLinks.length > 0) {

        for(let i = 0; i < fileJson.dataLinks.length; i++) {
          const link = fileJson.dataLinks[i];
          const dataFiles = link.dataFiles;

          fileJson[link.property] = dataFiles.map((dataFile) => {
            return require(`${contentsFolder}/${dataFile}`)[link.sourceProperty];
          });
        }
      }

      if (fileJson.exportToJson) {
        const exportedField = fileJson.exportToJson.source;
        const exportedContents = fileJson[exportedField];
        const exportedSerializedJson = JSON.stringify(exportedContents);
        gulpFile(`${htmlFileName}.json`, exportedSerializedJson, { src: true })
          .pipe(app.dest(pageLocation));
      }

      if (fileJson.exportToIcal) {
        const sources = fileJson.exportToIcal.sources;
        let icalFiles = [];
        sources.map((source) => {
          const sourcePathParts = source.split('.');
          let property = fileJson;

          for(let i = 0; i < sourcePathParts.length; i++) {
            property = property[sourcePathParts[i]];
            if (Array.isArray(property)) {
              property = processArray(property, sourcePathParts.splice(i + 1, sourcePathParts.length));
              break;
            }
          }

          if (Array.isArray(property)) {
            icalFiles = icalFiles.concat(property);
          } else {
            property.stampTime = getTimeStamp();
            icalFiles.push(property);
          }
        });
        
        icalFiles.map((sourceJson) => {
          const icalFileName = sourceJson.subject.toLowerCase().replace(' ', '-');

          app.src('app/handlebars/pages/ics.hbs')
            .pipe(app.renderFile(sourceJson))
            .pipe(rename(`${icalFileName}.ics`))
            .pipe(app.dest(outputDir));
        });
      }
      
      fileJson.title = fileJson.sitemap.title;

      app.src(`app/handlebars/pages/${templateFile}`)
        .pipe(app.renderFile(fileJson))
        .pipe(rename(`${htmlFileName}.html`))
        .pipe(app.dest(pageLocation));

      return app;
    }))
    .pipe(browserSync.stream());
});

app.task('images', () => {
  return app.src('app/images/**/*')
  // .pipe($.cache($.imagemin({
  //   progressive: true,
  //   interlaced: true,
  //   // don't remove IDs from SVGs, they are often used
  //   // as hooks for embedding and styling
  //   svgoPlugins: [{cleanupIDs: false}]
  // })))
      .pipe(app.dest('dist/images'));
});

app.task('downloads', () => {
  return app.src('app/downloads/**/*')
      .pipe(app.dest('dist/downloads'));
});

app.task('fonts', () => {
  return app.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2,otf}', function (err) {})
      .concat('app/fonts/**/*'))
      .pipe(app.dest('.tmp/fonts'))
      .pipe(app.dest('dist/fonts'));
});

app.task('extras', () => {
  return app.src([
    'app/*.*',
    '!app/*.html'
  ], {
    dot: true
  }).pipe(app.dest('dist'));
});

app.task('clean', del.bind(null, ['.tmp', 'dist']));

function reload() {
  return browserSync.stream();
}

app.task('serve', ['styles', 'scripts', 'assemble', 'includes', 'npm-files', 'fonts'], () => {
  browserSync.init({
    // notify: false,
    port: 9000,
    server: {
      baseDir: ['.tmp', 'app'],
    }
  });

  app.watch([
    'app/images/**/*',
    'app/downloads/**/*',
    '.tmp/includes/**/*'
  ]).on('change', reload);

  app.watch('app/handlebars/**/*.hbs', ['assemble']).on('change', reload);
  app.watch('app/styles/**/*.scss', ['styles', 'assemble']);
  app.watch('app/scripts/**/*.js', ['scripts']);
  app.watch('app/includes/**/*', ['includes']);
  app.watch('app/fonts/**/*', ['fonts']);
});

// inject bower components
app.task('wiredep', () => {
  app.src('app/styles/*.scss')
      .pipe(wiredep({
        ignorePath: /^(\.\.\/)+/
      }))
      .pipe(app.dest('app/styles'));

  app.src('app/handlebars/**/*.hbs')
      .pipe(wiredep({
        exclude: ['bootstrap-sass'],
        ignorePath: /^(\.\.\/)*\.\./
      }))
      .pipe(app.dest('app'));
});

app.task('build', ['assemble', 'html', 'json', 'ics', 'images', 'downloads', 'includes', 'extras', 'fonts'], () => {
  return app.src('dist/**/*').pipe($.size({
    title: 'build',
    gzip: true
  }));
});

app.task('default', ['clean'], () => {
  app.build('build', (err) => {
    if (err) throw err;
    console.log('done!');
  });
});

// expose your instance of assemble to assemble's CLI
module.exports = app;
