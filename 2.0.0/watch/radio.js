KISSY.add(function(S){

  "use strict";

  function getRadioValue(el){

    var ret;

    el.all('input').each(function(element){
      if (element.attr('checked')) {
        ret = element.val();
      }
    });

    return ret;

  }

  return function(watch){

    watch.add('radio', function(){

      var $control = this.$control;
      var model = $control('model');
      var key = $control('key');
      var el = $control('el');

      el.delegate('change', 'input', function(e){

        var target = S.all(e.currentTarget);
        var val = target.val();

        model.set(key, val);

      });

      var val = getRadioValue(el);

      if (val && model.get(key) != val) {
        S.later(function(){
          model.set(key, val);
        });
      }

    });

  };

}, {
});
