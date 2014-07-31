KISSY.add(function(S, XTemplate){

  "use strict";

  function getValue(el){

    var ret;

    if (el.getDOMNode().tagName.toLowerCase() == 'select') {
      return el.val();
    }

    el.all('input').each(function(element){
      if (element.attr('checked')) {
        ret = element.val();
      }
    });

    return ret;

  }

  function add(watch){

    watch.add('linkage', {

      init: function(){


        var $control = this.$control;

        var model = $control('model');
        var key = $control('key');
        var linkage = $control('argv')[0];
        var el = $control('el');
        var paths = key.split('.');

        model.change(linkage, function(){

          var fn = $control('fn');

          var html = new XTemplate(fn);
          var option = {params: [model.get(key)], fn: fn};
          var scopesNew = $control('scopes').slice();
          scopesNew.unshift(model.get(key));
          html = html.config.commands.each(scopesNew, option);

          // 火狐下对select进行innerHMTL有bug
          // 在低端android浏览器，也有这个问题，全部使用innerHMTL
          //if (S.UA.firefox) {
          el[0].innerHTML = html;
          //} else {
            //var ret = el.html(html);
          //}

          model.set(paths[0] + '.defaultValue', getValue(el));
          $control('view').fire('inited');
          model.fire('render:linkage', { key: key, el: el });

        });

        var val = getValue(el);
        if (val) {
          model.set(paths[0] + '.defaultValue', val);
        }
      },


      beforeReady: function(){

        var $control = this.$control;
        var model = $control('model');
        var key = $control('key');
        var linkage = $control('argv')[0];

        model.setLinkage(key, linkage);
      }

    });

  }

  return add;

}, {
  requires: ['../xtemplate']
});
