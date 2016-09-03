var buildify = require('buildify');
 

buildify()
  .load('src/impressionist.js')
  .concat(['src/plugins/axis/axis.js',
           'src/plugins/camera/camera.js',
           'src/plugins/cameracontrols/cameracontrols.js',
           'src/plugins/toolbar/toolbar.js'])
  .save('js/impressionist.js')
  .uglify()
  .save('js/impressionist.min.js');


buildify()
  .load('src/impressionist.css')
  .concat(['src/plugins/axis/axis.css',
           'src/plugins/camera/camera.css',
           'src/plugins/cameracontrols/cameracontrols.css',
           'src/plugins/toolbar/toolbar.css'])
  .save('css/impressionist.css');
