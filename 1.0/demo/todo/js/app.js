(function( window, S) {

  'use strict';

  if (S.Config.debug) {
    var srcPath = "../../../../";
    S.config({
      packages:[
        {
          name: "gallery",
          path: srcPath,
          charset: "utf-8",
          ignorePackageNameInUri: true
        }
      ]
    });
  }

  S.use('gallery/bidi/1.0/index', function (S, Bidi) {

    Bidi.active(['action', 'class', 'attr', 'text'])

    Bidi.xbind('todoapp', {
      todos: [
        { text: 'hello' },
        { text: 'hehe', isCompleted: true }
      ]
    });

    Bidi.init();

  });

})( window, KISSY );
