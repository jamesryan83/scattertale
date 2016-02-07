var gulp = require("gulp");
var sass = require("gulp-sass");
var watch = require("gulp-watch");
var autoprefixer = require("gulp-autoprefixer");
var exec = require('child_process').exec;


// main
gulp.task("default", ["watch"]);


// watch folders
gulp.task("watch", function() {
    gulp.watch("./public/scss/**/*.scss", ["scss"]);
    gulp.watch("./public/views/**/*.html", ["html"]);
});


// sass
gulp.task("scss", function () {
    return gulp.src("./public/scss/**/*.scss")
        .pipe(sass().on("error", sass.logError))
        .pipe(autoprefixer({
            browsers: ["> 5%"],
            cascade: false
        }))
        .pipe(gulp.dest("./public/css"));
});


// combine html files (backbone templates)
gulp.task("html", function () {
    exec('htmlcat --in public/views/main.html --out public/app.html', function(err) {
        if (err) console.log(err);
    });
});
