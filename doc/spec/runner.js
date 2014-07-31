KISSY.add(function(){

  if (window.mochaPhantomJS) {
    mochaPhantomJS.run();
  } else {
    mocha.run();
  }

}, {
  requires: [
    './runner/simple',
    './runner/form',
    './runner/lists',
    './runner/webmail'
  ]
});
