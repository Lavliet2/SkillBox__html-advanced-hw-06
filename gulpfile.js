const { src, dest, series, watch, parallel } = require('gulp');
const concat = require('gulp-concat');
const htmlMin = require('gulp-htmlmin');
const autoprefixes = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const svgSprite = require('gulp-svg-sprite');
const image = require('gulp-image');
const uglify = require('gulp-uglify-es').default;
const babel = require('gulp-babel');
const notify = require('gulp-notify');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const yargs = require('yargs');
const gulpUtil = require('gulp-util');
const browserSync = require('browser-sync').create();

const isProd = yargs.argv.prod;
const dist = isProd ? 'build' : 'dev';

const clean = () => {
    return del([dist])
}

const resources = () => {
    if (!isProd) {
        return src('src/resources/**')
        .pipe(dest(dist))
    }
    else {
        return gulpUtil.noop()
    }
} 

const styles = () => {
    return src('src/styles/**/*.css')
        .pipe(!isProd ? sourcemaps.init() : gulpUtil.noop())
        .pipe(concat('main.css'))
        .pipe(autoprefixes({
            cascade: false
        }))
        .pipe(isProd ? cleanCSS({level: 2}) : gulpUtil.noop())
        .pipe(!isProd ? sourcemaps.write() : gulpUtil.noop())
        .pipe(dest(dist))
        .pipe(browserSync.stream());
}

const htmlMinify = () => {
    return src('src/**/*.html')
        .pipe(isProd ? htmlMin({collapseWhitespace: true,}) : gulpUtil.noop() )
        .pipe(dest(dist))
        .pipe(browserSync.stream());
}

const svgSprites = () => {
    return src('src/images/svg/**/*.svg')
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: '../sprite.svg'
                }
            }
        }))
        .pipe(dest(dist+'/images'))
}

const images = () => {
    return src([
        'src/images/**/*.jpg',
        'src/images/**/*.png',
        'src/images/**/*.jpeg',
        'src/images/*.svg',
    ], ({encoding: false}))        
        .pipe(image())
        .pipe(dest(dist+'/images'))
}

const images = () => {
    return src('src/images/**/*.{jpg,png}')
        .pipe(image())
        .pipe(dest(dist+'/images'));
};

const scripts = () => {
    return src([
        'src/js/components/**/*.js',
        'src/js/main.js'
    ])
    .pipe(!isProd ? sourcemaps.init() : gulpUtil.noop())
    .pipe(babel({
        presets: ['@babel/env']
    }))
    .pipe(concat('app.js'))
    .pipe(isProd ? uglify({toplevel: true}).on('error', notify.onError()) : gulpUtil.noop())
    .pipe(!isProd ? sourcemaps.write() : gulpUtil.noop())
    .pipe(dest(dist))
    .pipe(browserSync.stream())
}

const watchFiles = () => {
    browserSync.init({
        server: {
            baseDir: dist
        }
    })
}

watch('src/resources/**')
watch('src/**/*.html', htmlMinify)
watch('src/styles/**/*.css', styles)
watch('src/images/svg/**/*.svg', svgSprites)
watch('src/js/**/*.js', resources)

exports.clean = clean;
exports.resources = resources
exports.htmlMinify = htmlMinify
exports.styles = styles
exports.svgSprites = svgSprites
exports.images = images
exports.scripts = scripts;
exports.default = series(clean, resources, htmlMinify, styles, svgSprites, images, scripts, watchFiles) 
exports.build = series(clean, parallel(htmlMinify, styles, svgSprites, images, scripts));