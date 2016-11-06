var buildify = require('buildify');
 

buildify()
   // Core impressionist file that provides impressionist() api function.
  .load('src/impressionist.js')
  // Libraries that are made available early, used by other plugins
  .concat(['src/lib/css3.js',
           'src/lib/util.js'])
  // Plugins provide features
  .concat([
           // Disabled when we moved to electron: 'src/plugins/axis/axis.js',
           'src/plugins/camera/camera.js',
           'src/plugins/cameracontrols/cameracontrols.js',
           'src/plugins/electron/electron.js',
           'src/plugins/loadcss/loadcss.js',
           'src/plugins/tinymce/tinymce.js',
           'src/plugins/toolbar/toolbar.js'])
  .save('js/impressionist.js')
  .uglify()
  .save('js/impressionist.min.js');


buildify()
  .load('src/impressionist.css')
  .concat([
           // Disabled when we moved to electron: 'src/plugins/axis/axis.css',
           'src/plugins/camera/camera.css',
           'src/plugins/cameracontrols/cameracontrols.css',
           'src/plugins/tinymce/tinymce.css',
           'src/plugins/toolbar/toolbar.css'])
  .save('css/impressionist.css');
