KISSY.add(function(S, Event, XTemplate, Watch){

  "use strict";

  function View(name, model){

    this.model = model;
    this.name = name;

  }

  S.augment(View, S.EventTarget, {

    setEl: function(el){

      this.el = el;
      this.template = new XTemplate(el.all('script').html());

      return this;

    },

    render: function(){

      var json = this.model.toJSON();
      json['__name__'] = this.name;

      var html = this.template.render(json);
      html = html.replace(/>\s+>>><<</g, '');
      this.el.html(html);

      this.fire('inited');

      return this;
    },

    watch: function(params, fn){

      var who = params[0];
      var key = params[1];
      var watcher = Watch.get(who);
      var id = params.id || 'bidi-' + this.name + '-' + S.guid();
      var selector = '#' + id;
      var argv = params.slice(2);
      var html = ' id=' + id + ' ';
      var meta = params.meta;

      if (watcher) {

        var w = new watcher({
          // watcher所对应的dom id选择器
          selector: selector,
          // 如果是list下一个元素，parent记录了父元素相关信息
          parent: meta,
          // id选择器对应的id，没有符号"#"
          id: id,
          // 绑定的数据对象键值
          key: key, 
          // 数据对象，model
          model: this.model,
          // view对应的NodeList
          base: this.el,
          // XTemplate执行函数，只在block语法下需要，比如linkage、list
          fn: fn,
          // 其他参数，{{watch "text: key: argv0: argv1}}
          argv: argv,
          name: this.name,
          view: this
        });

        var _init = function(){
          // dom ready
          w.$control('el', this.el.all(selector));
          w.fire('ready');

          this.detach('inited', _init);
        }

        this.on('inited', _init);

        html = w.$html || html;

      } else {

        S.log('watcher ' + who + ' is not defined!');

      }

      return {id: id, html: html};
    }

  });

  return View;

}, {
  requires: [
    'event',
    'xtemplate',
    './watch/index'
  ]
});
