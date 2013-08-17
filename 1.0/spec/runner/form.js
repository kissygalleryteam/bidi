
KISSY.add(function(){

  describe('From', function(){

    it('select value should equal to defaultValue in model', function(){
      var form = window.Bidi.form;
      var model = form.model;
      var el = form.el.all('.form-group').item(0);
      var select = el.all('select');

      expect( +select.val() ).to.be(model.get('problem.defaultValue'));
    })

    it('problem.$item.text support', function(){
      var form = window.Bidi.form;
      var model = form.model;
      var el = form.el.all('.form-group').item(0);
      var text = el.all('em');

      var values = model.get('problem.values')
      var $item;
      var defaultValue = model.get('problem.defaultValue')
      KISSY.some(values, function(item){
        if (item.value === defaultValue) {
          $item = item;
          return true;
        }
      })

      expect( $item.text ).to.be(model.get('problem.$item.text'));
      expect( text.text() ).to.be(model.get('problem.$item.text'));
    })

    it('problem.$item.text change with problem.defaultValue change', function(){
      var form = window.Bidi.form;
      var model = form.model;
      var el = form.el.all('.form-group').item(0);
      var text = el.all('em');
      var select = el.all('select')
      var values = model.get('problem.values');
      var $item = values[2];
      //before select change
      var oldText = model.get('problem.$item.text')

      select.val($item.value);
      select.fire('change');

      //after select change
      expect( +model.get('problem.defaultValue') ).to.be($item.value);
      expect( text.text() ).not.to.be(oldText);
    })

    it('editable toggle classname', function(){
      var form = window.Bidi.form;
      var model = form.model;
      var el = form.el.all('.form-group').item(0);
      var text = el.all('em').parent();
      var select = el.all('select')

      //before click fire the action editable
      expect( text.hasClass('hide') ).to.be(false);
      expect( select.hasClass('hide') ).to.be(true);

      //after click do
      el.all('a').fire('click');
      expect( text.hasClass('hide') ).to.be(true);
      expect( select.hasClass('hide') ).to.be(false);

      //after click do
      el.all('a').fire('click');
      expect( text.hasClass('hide') ).to.be(false);
      expect( select.hasClass('hide') ).to.be(true);
    })

    it('linkage support, problem.defaultValue change with select', function(){
      var form = window.Bidi.form;
      var model = form.model;
      var select = form.el.all('.form-group').item(0).all('select');
      var radioBox = form.el.all('.form-group').item(1).all('.xform');
      var reasons = model.get('problem.$item.reasons');
      var value = model.get('problem.$item.value');

      expect(radioBox.all('input').length).to.be(reasons.length);

      //修改
      select.val(4);
      select.fire('change');

      expect(radioBox.all('input').length).to.be(2);
      expect(radioBox.parent('.form-group').hasClass('hide')).to.be(false);

      //修改
      select.val(5);
      select.fire('change');
      expect(radioBox.all('input').length).to.be(0);
      expect(radioBox.parent('.form-group').hasClass('hide')).to.be(true);

      //恢复
      select.val(value);
      select.fire('change');
    })

    it('sub linkage support, reasons.defaultValue change with subs', function(){
      var form = window.Bidi.form;
      var model = form.model;
      var select = form.el.all('.form-group').item(0).all('select');
      var radioBox = form.el.all('.form-group').item(1).all('.xform');
      var subEl = form.el.all('.form-group').item(2);

      select.val(1);
      select.fire('change');
      expect(subEl.hasClass('hide')).to.be(true);

      //选中第一个radio，将出现第三级联动的radio
      radioBox.all('input').item(0).fire('click');
      var subs = model.get('reasons.$item.subs');
      expect(subs.length).to.be(2);
      expect(subEl.all('input').length).to.be(2);
      expect(subEl.hasClass('hide')).to.be(false);

      //选中第二个radio，第三级隐藏，并且radio为空
      radioBox.all('input').item(1).fire('click');
      expect(subEl.hasClass('hide')).to.be(true);
      expect(subEl.all('input').length).to.be(0);
    })

    it('expression not(!itemSendBack) support', function(){
      var form = window.Bidi.form;
      var model = form.model;
      var radio = form.el.all('.form-group').item(3).all('input').item(1);
      var radio1 = form.el.all('.form-group').item(3).all('input').item(0);
      var warning = form.el.all('.form-group').item(3).all('.label-warning').item(0);
      var logistics = form.el.all('.logistics')
      var feedback = form.el.all('.feedback')

      expect(warning.hasClass('hide')).to.be(true)
      expect(logistics.hasClass('hide')).to.be(true);
      expect(feedback.hasClass('hide')).to.be(true);

      //选中已寄回商品，需要显示label-warning提示，退货信息和退货反馈
      radio.fire('click');
      //第一次click代理事件没法捕获，不知道为啥
      radio.fire('click');
      expect(warning.hasClass('hide')).to.be(false)
      expect(logistics.hasClass('hide')).to.be(false);
      expect(feedback.hasClass('hide')).to.be(false);

      radio1[0].click()
      expect(warning.hasClass('hide')).to.be(true)
      expect(logistics.hasClass('hide')).to.be(true);
      expect(feedback.hasClass('hide')).to.be(true);
      expect(feedback.all('input').attr('disabled')).to.be('disabled');
    })

    it('expression logic (!itemSendBack || reasons.$item.jude) support', function(){
      var form = window.Bidi.form;
      var model = form.model;
      var select = form.el.all('select', '.problem')
      var jude = form.el.all('.jude')

      model.set('problem.defaultValue', 1)
      expect( +select.val() ).to.be(1);

      var radio = form.el.all('.reasons').all('input')
      radio.item(0).fire('click');
      expect(model.get('reasons.$item.jude')).to.be(true);
      expect(jude.hasClass('hide')).to.be(false);

      var sendBackEl = form.el.all('.isSendBack');
      sendBackEl[0].click()
      expect(model.get('itemSendBack')).to.be('checked');
      expect(jude.hasClass('hide')).to.be(true);
    })

    it('function relation support, realMax call problem.defaultValue', function(){
      var form = window.Bidi.form
      var model = form.model
      var realmax = form.el.all('.realmax')

      var refundMoney = model.get('refundMoney')
      expect( +realmax.text() ).to.be(model.get('refundMoney.max'))
      model.set('problem.defaultValue', 3)
      expect( +realmax.text() ).to.be(refundMoney.max - refundMoney.postage)
    });

  });
})
