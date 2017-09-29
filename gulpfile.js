const gulp = require('gulp');
const ts = require('gulp-typescript');

gulp.task('ts', () => {
    return gulp.src('src/**/*.ts')
        .pipe(ts({
            removeComments: true,
            target: 'ES6',
            module: 'commonjs',
            moduleResolution: 'node'
        }))
        .pipe(gulp.dest('dist/'));
});

gulp.task('watch', () => {
    gulp.watch('src/**/*.ts', ['ts']);
});

gulp.task('default', ['ts']);