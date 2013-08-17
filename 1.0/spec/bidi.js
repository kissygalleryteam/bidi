KISSY.add(function(S, Bidi, simple, form, lists){

  window.Bidi = {};
  window.Bidi.simple = simple;
  window.Bidi.form = form;
  window.Bidi.lists = lists;

  Bidi.init();

  S.use('gallery/bidi/1.0/spec/runner');

}, {
  requires: [
    '../index',
    '../demo/simple',
    '../demo/form',
    '../demo/lists'
  ]
})
