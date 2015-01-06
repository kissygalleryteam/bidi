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
<<<<<<< HEAD:1.0/watch/select.js
        model.set(key, el.val(), parent);
=======
        if (model.val)
           return model.val(key, el.val());
        model.set(key, this.selectedIndex, parent);
>>>>>>> 0b2da3de0204d9d22f47b388293c36deb7bc8857:watch/select.js
      });

    });

  }

}, {
});
