KISSY.add(function(S){

  "use strict";

  return function(watch){

    watch.add('attr', function(){

      var $control = this.$control;
      var model = $control('model');
      var key = $control('key');
      var expr = model.evaluation($control);

      attr(expr.val);

      model.change(expr.related, function(){
        attr(model.evaluation($control).val);
      });

      function attr(val){
        var el = $control('el');
        var attrname = $control('argv')[0];
        el.attr(attrname, val);
      }

    });

  }

});
