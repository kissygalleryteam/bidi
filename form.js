KISSY.add(function(S, Event, Model){

  "use strict";

  function Form(obj){

    Model.apply(this, arguments);

    return this;
  }

  S.augment(Form, Model, {

    get: function(key){ 

      var val = this.attributes[key]; 

      var type = KISSY.type(val);

      if (type == 'function') {

        val = val.call(this);

      } else if (type == 'object') {


        if (val['$filter']) {

          var item = this.item(val['$filter']);
          var filter = item && item[key];
          var ret;

          if (filter) {
            ret = S.filter(val['$values'], function(item){
              return S.indexOf(item.value, filter) > -1;
            });
          }

          val = ret;

        } else {

          val = val['$values'];

        }


      }

      if (this.__recode) {
        this.__getter.push(key);
      }

      return val;
    },

    /**
     * 获取某个表单所对应的对象，通常，如果是一个select或者radio，一个select对应
     * 的$values有多个，item根据select的$defaultValue所对应的对象
     */
    item: function(key){

      var items = this.get(key);
      var val = this.val(key);
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

    set: function(key, value){

      if (key in this.attributes) {

        var old = this.attributes[key];
        this.attributes[key] = value;

        this.fire('change:' + key, {name: key, old: old, value: value});

      } else {

        this.attributes[key] = value;
        this.fire('change:' + key, {name: key, value: value});

      }

      return this;

    },

    val: function(key, val){

      if (val) {
        this.attributes[key].$defaultValue = val;
        this.fire('change:' + key);
        return this;
      } else {
        return this.attributes[key].$defaultValue;
      }

    },

    setLinkage: function(key, val){
      this.attributes[key]['$filter'] = val;
      return this;
    }

  });

  return Form;

}, {
  requires: ['event', './models']
});
