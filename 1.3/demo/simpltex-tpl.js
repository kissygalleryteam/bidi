/*
  Generated by kissy-tpl2mod.*/
KISSY.add('<div class="panel panel-primary">\n  <div class="panel-heading">示例1,简单情况. <a class="pull-right" href="http://jsfiddle.net/AAEZP/1/embedded/result,html,js/">Edit It &gt;&gt;</a>\n  </div>\n  <p>hello, I am <strong {{{watch "text: fullName"}}}></strong></p>\n  <p>hello, I am <strong {{{watch "text: firstName"}}}></strong></p>\n  First Name: <input {{watch "value: firstName"}}/><br>\n  Last Name: <input {{watch "value: lastName"}}/> {{text}}\n  <button {{watch "click: capitalizeLastName"}}>Go caps</button>\n</div>\n<input type="hidden" {{watch "attr: a == 1: disabled"}}/>\n<input type="hidden" {{watch "attr: a === 1: disabled"}}/>\n');