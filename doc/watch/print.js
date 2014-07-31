KISSY.add(function(S){

  "use strict";

  return function(watch){

    //print命令，只在模板渲染时候运行，如果key的运算为true，则返回第二个字符串，
    //或者key运算的返回值，不做任何的绑定
    watch.add('print', {

      init: function(){},

      beforeReady: function(){
        var $control = this.$control;
        var model = $control('model');
        var val = model.evaluation($control).val;
        var text = $control('argv')[0];
        if (val) {
          this.$html = text || val;
        } else {
          this.$html = '';
        }
      }
    });

  }

});
