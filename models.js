KISSY.add(function(S, evaluation){

  "use strict";

  function Model(obj, augment){

    var attributes;

    function Attr(){}

    if (augment) {

      S.augment(Attr, augment);

      attributes = new Attr();
      S.mix(attributes, obj);

    } else {

      attributes = obj;

    }

    this.attributes = attributes;

    this.linkages = {};
    this.lists = {};

    return this;
  }

  S.augment(Model, S.EventTarget, {

    /**
     * @private
     */
    _isFunc: function(key, parent){
      var val;
      if (parent) {
        val = this._getParent(parent)[key];
      } else {
        val = this._getAttr(key);
      }

      return S.isFunction(val);
    },

    setLists: function(key){
      this.lists[key] = true;
    },

    /**
     * get方法，获取key值，默认情况下，直接从数据根节点获取数据，如果parent参数
     * 不为空，则通过parent来查找变量
     * @public
     * @param {string} key 需要查找的变量的key
     * @param {undefined|object} parent key的范围，默认为根节点
     */
    get: function(key, parent){ 

      if (parent) {
        return this._getByParent(key, parent);
      }

      var val = this._getAttr(key);

      if (typeof val == 'function' && !this.__forbidden_call) {
        val = val.call(this);
      }

      if (this.__recode) {
        this.__getter.push(key);
      }

      return val;
    },

    /**
     * 和this.get一样，只是call用于处理函数，并且可以自定义其他参数和函数执行上下文
     * @param {string} key 支持字符串和点操作，函数获取路径
     * @param {array} args 其他参数
     * @param {object|undefined} context 函数执行上下文
     * @param {object} parent
     * @return this
     */
    call: function(key, args, context, parent){

      var fn = this._getAttr(key);
      if (!S.isFunction(fn)) return this;

      args = S.isArray(args) ? args : [args];
      context = context || this;

      if (parent) {
        args.push(this.get(null, parent));
      }

      return fn.apply(context, args);

    },

    _getLinkage: function(key, ret){

      var _key, _paths;
      _paths = key.split('.');

      S.each(this.linkages, function(v, linkKey){

        if (key.indexOf(linkKey) === 0){

          _key = linkKey;

          var paths = _key.split('.');
          var filter = this.item(v);
          var last = paths[0];

          S.each(paths, function(path){
            ret = ret[path];
            if (ret === undefined) return false;
          });

          _paths = _paths.slice(paths.length);

          if (filter && filter[last]) {
            filter = filter[last];
            ret = S.filter(ret, function(item){
              return item && S.indexOf(item.value, filter) > -1;
            });
          } else if (filter || filter === undefined) {
            //当filter等于null的时候，说明关联的字段不存在，这样返回全部
            ret = undefined;
          }

          return false;
        }

      }, this);

      return { key: _key, value: ret, paths: _paths };

    },

    _getAttr: function(key, base){

      var ret = base || this.attributes;
      var paths = key.split('.');

      var linkage = this._getLinkage(key, ret);

      if (linkage.key) {
        ret = linkage.value;
        paths = linkage.paths;
      }

      //$aa.$item.attr
      if (paths.length > 2 && paths[1] === '$item') {
        ret = this.item(paths[0]);
        paths = paths.slice(2);

        if(!ret) return ret;
      }

      S.each(paths, function(path){
        ret = ret && ret[path];
        if (ret === undefined) return false;
      });

      return ret;
    },

    /**
     * 获取某个表单所对应的对象，通常，如果是一个select或者radio，一个select对应
     * 的$values有多个，item根据select的$defaultValue所对应的对象
     */
    item: function(key){

      var items = this.get(key);

      if (items) {
        var val = items.defaultValue;
        items = items.values;
      } else {
        return null;
      }

      var ret;

      if (!items) return ret;

      S.some(items, function(item){
        if (item.value == val) {
          ret = item;
          return true;
        }
      });

      return ret;

    },
    /**
     * 获取key来查找，parent对象定义了key所处的id和根节点name
     * @private
     */
    _getByParent: function(key, parent){

      var ret;
      var root = false;
      if (key && key.indexOf('$root.') === 0) {
        ret = this._getAttr(key.slice(6));
        root = true;
      } else {
        var val = this._getParent(parent);
        ret = key !== null? this._getAttr(key, val): val;
      }

      if (S.isFunction(ret)){
        if (!root) {
          //如果在list中，函数第一个参数是，list所在的对象
          val.parent = this;
          ret = ret.call(val, parent);
        } else {
          ret = ret.call(this, this.get(null, parent));
        }
      }

      if (this.__recode) {
        this.__getter.push(parent.name + ':' + parent.id);
      }

      return ret;
    },

    /**
     * @private
     */
    _getParent: function(parent){

      // this.set('xxx', 'seat');
      if (parent.__parent__) return parent;

      var name = parent.name;
      var o = this.get(name);
      var ret = {};

      S.some(o, function(val){

        if (val['__parent__'].id === parent.id) {
          ret = val;
          return true;
        }

      }, this);

      return ret;
    },

    getRelated: function(key, parent){

      if (this._isFunc(key, parent)) {

        this.__recode = true;
        this.__getter = [];
        this.get(key, parent);
        this.__recode = false;

        return this.__getter.slice();

      } else {

        return parent ? [parent.name + ':' + parent.id] : [key];

      }

    },

    /**
     * return json object of attributes
     */
    toJSON: function(){ 

      var json = {};

      this.__forbidden_call = true;

      S.each(this.attributes, function(val, key){

        if (this.attributes.hasOwnProperty(key)) {
          json[key] = this.get(key);
        }

      }, this); 

      delete this.__forbidden_call;

      return json;
    },

    /**
     * 绑定change:xxx事件封装，直接使用this.on('change:' + xxx)感觉不好，另外支
     * 持传入一个数组，对于多个属性封装，使用数组更方便
     * @param {array|string} key 需要绑定change事件的属性
     * @param {function} fn 回调函数
     * @param {object|undefined} context 执行上下文，可以不填
     * @return this
     */
    change: function(key, fn, context){

      var evt = '';

      if (S.isArray(key)){

        evt = S.map(key, function(name){
          return 'change:' + name + ' add:' + name + ' remove:' + name;
        }).join(' ');

      } else {
        evt = 'change:' + key;
      }

      this.on(evt, fn, context);

      return this;

    },

    /**
     * 赋值方法，通过set，修改属性值，并且，触发事件
     * @param {string} key 属性的key
     * @param {object} value
     * @param {object|undefined} parent 定义parent，在list中需要用到
     * @public
     * @return this
     */
    set: function(key, value, parent){

      //判断一个key是否是逻辑表达式，比如a > b, a == b，如果是，不执行set操作
      if (/[<=>!|&]+/.test(key)) {
        return;
      }

      // 临时禁止set方法，在toJSON方法调用的时候需要如此
      if (this.__forbidden_call) return;

      if (parent) {
        return this._setByParent(key, value, parent);
      }

      var paths = key.split('.');
      var attr = this.attributes;
      var len = paths.length;

      S.each(paths, function(path, i){

        if (path in attr && i < len - 1) {
          attr = attr[path];
        } else {
          return false;
        }

      });

      var last = paths[len - 1];

      //如果是list，给每个元素增加一个属性
      if (key in this.lists) this._addToken(key, value);

      //if (attr[last] == value) return this;

      attr[last] = value;

      this.fire('change:' + paths[0], {path: paths.slice(1), val: value});
      return this;

    },

    //增加parent的标志
    _addToken: function(key, lists){
      S.each(lists, function(list){
        list['__parent__'] = { name: key, id: S.guid('$id') };
      })
    },

    /**
     * 删除集合中的一个元素
     * @param {object} obj 集合元素
     * @public
     * @return this
     */
    remove: function(obj){

      if (this.__forbidden_call) return;

      if (obj.__parent__)
        obj = obj.__parent__;

      var parentKey = obj.name;
      var lists = this.get(parentKey);
      var index;

      S.some(lists, function(list, i){
        if (list['__parent__'].id === obj.id){
          index = i;
          return true;
        }
      });

      //删除元素
      lists.splice(index, 1);
      this.fire('remove:' + parentKey, {id: obj.id, index: index});

      return this;
    },

    /**
     * 在list中添加一个元素
     * @param {object} obj 需要加入元素
     * @param {string} key 需要增加的属性
     * @public
     */
    add: function(obj, key){

      if (this.__forbidden_call) return;

      obj['__parent__'] = { id: S.guid('$id'), name: key};
      var lists = this.get(key);

      lists.push(obj);
      this.fire('add:' + key, {obj: obj});

      return this;
    },

    /**
     * @private
     */
    _setByParent: function(key, value, parent){

      var o = this._getParent(parent);
      if (o) o[key] = value;

      var _p = parent.__parent__ || parent;
      this.fire('change:' + _p.name, { $item: _p.id });
      this.fire('change:' + _p.name + ':' + _p.id);
    },

    /**
     * 对表达式求值
     * @return {object} { val: Boolen, related: Array }
     */
    evaluation: function($control){
      return evaluation($control);
    },

    setLinkage: function(key, val){
      this.linkages[key] = val;
      return this;
    }

  });

  return Model;

}, {
  requires: [
    './expression/index',
    'event'
  ]
});
