KISSY.add(function(S){

  "use strict";

  function add(watch){
    
    watch.add('text', {

      init: function(){

        var $control = this.$control;
        var model = $control('model');
        var key = $control('key');

        var el = $control('el');
        var expr = model.evaluation($control);

        var argv = $control('argv');
        var pipe = argv[0];

        model.change(expr.related, function(){

          var val = model.evaluation($control).val;

          if (pipe && pipe in watch.pipe){
            val = watch.pipe[pipe](val);
          }

          el.html(val);

        }, this)

      },

      beforeReady: function(){

        var $control = this.$control;
        var model = $control('model');
        var val = model.evaluation($control).val || '';
        var argv = $control('argv');
        var pipe = argv[0];

        if (pipe && pipe in watch.pipe){
          val = watch.pipe[pipe](val);
        }

        this.$html = ' id=' + $control('id') + '>' + val + '<!----';
        watch.noEscape[this.$html] = true;

      }

    });

  }

  return add;

});
