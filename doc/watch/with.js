KISSY.add(function(S, XTemplate){

  "use strict";

  function add(watch){

    watch.add('with', {

      init: function(){

        var $control = this.$control;
        var model = $control('model');
        var key = $control('key');

        model.change(key, function(e){

          if (e.$item || e.path.length) return;

          var fn = $control('fn');
          var option = {params: [e.val], fn: fn};

          var json = model.toJSON();
          json['__name__'] = $control('name');

          var html = option.fn([e.val, json]);

          $control('el').html(html);
          $control('view').fire('inited');

        });

      },

      beforeReady: function(){
        //var $control = this.$control();
        //var model = $control.model;
        //model.setLists($control.key);
      }

    });

  }

  return add;

}, {
  requires: ['../xtemplate']
});
