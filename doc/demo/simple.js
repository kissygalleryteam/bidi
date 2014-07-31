KISSY.add(function(S, Bidi, html){
  //Bidi.active(['text', 'click']);
  var view = Bidi.xbind('user', {
    a: "1",
    text: 'haha',
    firstName: 'Song',
    lastName: 'Eward',
    fullName: function(){
      return this.get('firstName') + ' ' + this.get('lastName');
    }
  }, {
    capitalizeLastName: function(){
      var lastName = this.get('lastName').toUpperCase();
      this.set('lastName', lastName);
    }
  }, html);

  return view;
}, {
  requires: ['../index', './simpltex-tpl']
});
