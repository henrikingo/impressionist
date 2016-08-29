var buildify = require('buildify');
 

buildify()
  .load('src/impressionist.js')
  .concat(['src/plugins/camera/camera.js',
           'src/plugins/toolbar/toolbar.js'])
  .save('js/impressionist.js')
  .uglify()
  .save('js/impressionist.min.js');


buildify()
  .load('src/impressionist.css')
  .concat(['src/plugins/toolbar/toolbar.css'])
  .save('css/impressionist.css');
