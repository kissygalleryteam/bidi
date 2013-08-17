KISSY.add(function(){

  describe('Simple bind', function(){

    it('text should equal data in the model', function(){
      var simple = window.Bidi.simple;
      var el = simple.el.all('strong');
      var el1 = el.item(0);
      var el2 = el.item(1);
      expect(el.length).to.be(2);
      expect(el1.text() === simple.model.get('fullName')).to.be(true);
      expect(el2.text() === simple.model.get('firstName')).to.be(true);
    })

    it('input value should equal data in the model', function(){
      var simple = window.Bidi.simple;
      var el = simple.el.all('input');
      var el1 = el.item(0);
      var el2 = el.item(1);
      expect(el.length).to.be(2);
      expect(el1.val() === simple.model.get('firstName')).to.be(true);
      expect(el2.val() === simple.model.get('lastName')).to.be(true);
    })

    it('text value should change with value of input', function(){
      var simple = window.Bidi.simple;
      var input = simple.el.all('input').item(0);
      var text = simple.el.all('strong');
      input.val('haha');
      input.fire('keyup');
      expect(simple.model.get('firstName')).to.be('haha');
      expect(text.item(0).text()).to.be('haha Eward');
    })

    it('change model value by model.set, dom value change the same', function(){
      var simple = window.Bidi.simple;
      var input = simple.el.all('input').item(1);
      var text = simple.el.all('strong');
      var model = simple.model;
      model.set('firstName', 'Song');
      expect(text.item(0).text()).to.be('Song Eward');
      simple.el.all('button').fire('click');
      expect(input.val()).to.be('EWARD');
      expect(text.item(0).text()).to.be('Song EWARD');
    })
  });
})
