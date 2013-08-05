KISSY.add(function(S, XTemplate){

  "use strict";

  function add(watch){

    watch.add('list', {

      init: function(){

        var $control = this.$control;
        var self = this;

        var model = $control('model');
        var key = $control('key');

        model.on('remove:' + key, function(e){

          var el = $control('el').parent().children();
          var index = e.index;
          el.item(index + 1).remove();

        });

        model.on('add:' + key, function(e){

          var fn = $control('fn');
          var option = {params: [e.obj], fn: fn};

          var json = model.toJSON();
          json['__name__'] = $control('name');

          var html = option.fn([e.obj, json]);
          $control('el').parent().append(html);

          $control('view').fire('inited');

        });

      },

      beforeReady: function(){

        var $control = this.$control;
        this.$html = '<{tag} class=xlist id=' + $control('id') + '></{tag}>';

      }

    });

  }

  return add;

}, {
  requires: ['xtemplate']
});
