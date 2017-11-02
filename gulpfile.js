const gulp = require('gulp');
const ts = require('gulp-typescript');
const { spawn } = require('child_process');

let proc;

const restart = () => {
    if (proc) proc.kill();
    proc = spawn('node', ['qmobile'], { cwd: './dist', stdio: 'inherit' });
}

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

gulp.task('live', ['default'], () => {
    restart();
    const watcher = gulp.watch('src/**/*', ['default']);
    watcher.on('change', () => {
        restart();
    })
})

gulp.task('default', ['ts']);