KISSY.add(function(S){

  "use strict";

  return function(watch){

    watch.add('radio', function(){

      var $control = this.$control;
      var model = $control('model');
      var key = $control('key');
      var el = $control('el');

      el.delegate('click', 'input', function(e){

        var target = S.all(e.currentTarget);
        var val = target.val();

        model.set(key, val);

      });

    });

  }

}, {
});
