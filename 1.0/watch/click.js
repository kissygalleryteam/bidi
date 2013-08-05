KISSY.add(function(S){

  "use strict";

  return function(watch){

    watch.add('click', function(){

      var $control = this.$control;
      var model = $control('model');
      var key = $control('key');
      var selector = $control('selector');

      $control('base').delegate('click', selector, function(){
        model.get(key, $control('parent'));
      });

    });

  }

} );
