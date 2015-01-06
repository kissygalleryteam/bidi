KISSY.add(function(S){

  "use strict";

  function add(watch){

    watch.add('value', {

      init: function(){

        var $control = this.$control();
        S.mix(this, $control);
        this._render();

      },

      beforeReady: function(){
        var $control = this.$control;
        var key = $control('key');
        var model = $control('model');
        var val = model.evaluation($control).val;

        if (val) {
          this.$html = ' value= ' + val + ' id=' + $control('id') + ' ';
        }
      },

      _render: function(){

        var el = this.el;
        var type = el.attr('type') || 'input';
        var model = this.model;
        var key = this.key;

        if (type == 'radio') {
          this._bindRadio();
        } else {
          //el.val(model.get(key));
          this._bindEvent();
        }

      },

      _bindRadio: function(){

        var el = this.el;
        var model = this.model;
        var base = this.base;
        var name = el.attr('name');
        var key = this.key;

        base.delegate('click', 'input', function(e){

          var target = e.currentTarget;

          if (target.type == 'radio' && target.name == name) {
            var val = el.attr('checked');
            model.set(key, val);
          }

        });

        model.change(key, function(){
          el.attr('checked', model.get(key));
        });

        var isChecked = el.attr('checked');

        //默认值配置
        if (isChecked) {
          model.set(key, isChecked);
        }

      },

      _bindEvent: function(){

        var el = this.el;
        var model = this.model;
        var key = this.key;
        var $control = this.$control;
        var expr = model.evaluation($control);
        var parent = this.parent;

        el.on('keyup change', function(){

          var val = el.val();
          model.set(key, val, parent);

        });

        model.change(expr.related, function(){
          var val = model.evaluation($control).val || '';
          el.val(val);
        });

      }

    });

  }

  return add;

}, {
});
