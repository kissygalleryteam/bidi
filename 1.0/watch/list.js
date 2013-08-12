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

          var el = $control('el').children();
          var index = e.index;
          el.item(index).remove();

        });

        model.on('add:' + key, function(e){

          var fn = $control('fn');
          var option = {params: [e.obj], fn: fn};

          var json = model.toJSON();
          json['__name__'] = $control('name');

          var html = option.fn([e.obj, json]).replace(/^>/, '');
          $control('el').append(html);

          $control('view').fire('inited');

        });

        this._bindChange();
      },

      _bindChange: function(){

        var $control = this.$control;
        var model = $control('model');
        var key = $control('key');

        model.change(key, function(e){

          if (e.$item) return;

          var fn = $control('fn');
          var option = {params: [e.val], fn: fn};

          var json = model.toJSON();
          json['__name__'] = $control('name');

          var html = new XTemplate(fn);
          html = html.runtime.option.commands.each([e.val, json], option);

          $control('el').html(html);
          $control('view').fire('inited');

        });

      },

      beforeReady: function(){
        var $control = this.$control();
        var model = $control.model;
        model.setLists($control.key);
      }

    });

  }

  return add;

}, {
  requires: ['xtemplate']
});
