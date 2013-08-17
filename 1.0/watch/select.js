KISSY.add(function(S){

  "use strict";

  return function(watch){

    watch.add('select', function(){

      var $control = this.$control;
      var model = $control('model');
      var key = $control('key');
      var el = $control('el');
      var parent = $control('parent');

      var expr = model.evaluation($control);
      el.val(expr.val);

      model.change(expr.related, function(e){
        var val = model.get(key, parent);
        el.val(val);
      });

      el.on('change', function(){
        model.set(key, el.val(), parent);
      });

    });

  }

}, {
});
