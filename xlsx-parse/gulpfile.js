const gulp = require('gulp')
const electron = require('electron-connect').server.create()

gulp.task('serve', () => {

  // Start browser process
  electron.start()

  // Restarr browser process
  gulp.watch(['main.js', 'renderer.js', 'xlsx-parse.js'], electron.restart)

  // Reload renderer process
  gulp.watch(['index.html'], electron.reload)
})
