KISSY.add(function(S){

  "use strict";

  var watchers = {};
  var watch = {}

  watch.noEscape = {};

  var esc = S.escapeHTML;
  //重写escapeHtml方法，增加白名单
  S.escapeHTML = function(s){
    return s in watch.noEscape ? s: esc(s);
  };

  watch.add = function(name, watcher){

    if (name in watchers) {
      S.error(name + ' has be add before');
    }

    if (S.isFunction(watcher)) {
      watcher = { init: watcher };
    }

    /**
     * cfg: el, key, model, base
     */
    watchers[name] = function(cfg){

      var $control = {};

      S.mix($control, cfg);

      this.$control = function(key, val){

        // $control() return all varialbe accessible
        if (!key) return S.mix($control, {});

        // $control(key)
        if (!val) return $control[key]; 
        
        //一次性写入
        // $control(key, val)
        if (!(key in $control)) $control[key] = val;

      };

      this.beforeReady && this.beforeReady();

      this.on('ready', this.init, this);

    };

    S.augment(watchers[name], S.EventTarget, watcher);

  };

  watch.get = function(name){
    return watchers[name];
  };

  watch.pipe = {};

  S.each(arguments, function(fn, i){
    if (i) fn(watch);
  });

  return watch;

}, {
  requires: [
    './text',
    './class',
    './click',
    './select',
    './attr',
    './each',
    './radio',
    './list',
    './value'
  ]
});
