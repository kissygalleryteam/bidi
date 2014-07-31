KISSY.add(function(S){

  "use strict";

  return function(watch){

    watch.add('action', function(){

      var $control = this.$control;
      var model = $control('model');
      var evt = $control('key');
      var selector = $control('selector');
      var argv = $control('argv');
      var fn = argv[0];

      if (fn) {
        $control('el').on(evt, function(e){
          var parent = $control('parent');
          model.call(fn, e, null, parent);
        });
      }
    });

  }

} );
