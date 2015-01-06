KISSY.add(function(S, Event, XTemplate, Watch){

  "use strict";

  function View(name, model){

    this.model = model;
    this.name = name;
    this.elements = [];

  }

  S.augment(View, S.EventTarget, {

    setEl: function(el){

      this.el = el;
      this.template = new XTemplate(el.all('script').html());

      if (this.template) {
        S.log('get template html from script/xtempalte')
      } else {
        S.error('Get template html form script/xtempalte, got none');
      }

      return this;

    },

    render: function(){

      var json = this.model.toJSON();
      json['__name__'] = this.name;

      S.log('start render xtempalte for bidi-' + this.name);

      var html = this.template.render(json);
      html = html.replace(/>\s+>>><<</g, '');

      //this.el.html(html);
      // ie 中el.html有点问题
      this.el.getDOMNode().innerHTML = html;

      this.fire('inited');

      return this;
    },

    /**
     * 通过绑定的key来获取dom节点，返回第一个dom节点
     */
    get: function(key){

      var ret;

      S.some(this.elements, function(element){
        if (element.key === key) {
          ret = element.el;
          return true;
        }
      });

      return ret;
    },

    /**
     * 通过绑定的key来获取所有的dom节点
     */
    getAll: function(key){

      var ret = [];

      S.each(this.elements, function(element){
        if (element.key === key) {
          ret.push(element.el);
        }
      });

      return ret;
    },

    watch: function(params, fn, scopes){

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
          // XTemplate执行时上下文，再次渲染模板，需要保持上下文环境
          scopes: scopes,
          // 其他参数，{{watch "text: key: argv0: argv1}}
          argv: argv,
          name: this.name,
          view: this
        });

        var _init = function(){
          // dom ready
          var el = this.el.all(selector);
          w.$control('el', el);
          w.fire('ready');

          this.elements.push( { key: key, el: el } );
          this.detach('inited', _init);
        }

        this.on('inited', _init);

        html = w.$html === undefined ? html : w.$html;

      } else {

        S.log('watcher ' + who + ' is not defined!');

      }

      return { id: id, html: html };
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
