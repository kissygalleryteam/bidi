KISSY.add(function(S){

  "use strict";

  return function(watch){

    watch.add('class', function(){

      var $control = this.$control;
      var model = $control('model');
      var key = $control('key');
      var classname = $control('argv')[0];

      var expr = model.evaluation($control);

      model.change(expr.related, change);

      function change(){
        var el = $control('el');
        var fn = model.evaluation($control).val ? 'addClass': 'removeClass';
        el[fn](classname);
      }

      change();

    });

  }

});
