KISSY.add(function(S, Bidi, simple, form, lists, webmail, formH, Uri){

  window.Bidi = {};
  window.Bidi.simple = simple;
  window.Bidi.form = form;
  window.Bidi.lists = lists;
  window.Bidi.webmail = webmail;

  var uri = new Uri(location.href);
  var query = uri.getQuery()
  var g = query.get('grep')
  var grep;

  if (g && g.indexOf) {
    if (g.indexOf('Simple') === 0) {
      grep = 'user'
    } else if (g.indexOf('FormH') === 0) {
      grep = 'form-h'
    } else if (g.indexOf('Form') === 0) {
      grep = 'form'
    } else if (g.indexOf('List') === 0) {
      grep = 'list'
    } else if (g.indexOf('Web mail') === 0) {
      grep = 'webmail'
    }
  }

  Bidi.init(grep);

  if (!query.has('noSpec')) {
    S.use('kg/bidi/1.0/spec/runner');
  }

  S.all('.nav-tabs').all('a').each(function(el){
    var href = el.attr('href')
    var _query = new Uri(href).query
    if (query.get('grep') === _query.get('grep') && 
       query.has('grep') === _query.has('grep') &&  
         query.get('noSpec') === _query.get('noSpec') && 
           query.has('noSpec') === _query.has('noSpec') 
       ){
      el.parent('li').addClass('active');
    }
  });

}, {
  requires: [
    '../index',
    '../demo/simple',
    '../demo/form',
    '../demo/lists',
    '../demo/webmail',
    '../demo/form-h',
    'uri'
  ]
})
