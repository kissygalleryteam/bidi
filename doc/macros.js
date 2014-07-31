/**
 * macros支持
 * {{#macro "error" "error"}}
 * {{#if error}}
 *    <span>error.text</span>
 * {{/if}
 * {{/macro}}
 *
 * {{{macro "error" error}}}
 */
KISSY.add(function(){

  var macros = {};

  function macro(scopes, option){

    var params = option.params;
    var macroName = params[0];

    //声明宏
    if (option.fn) {

      var formal = params.slice(1);

      macros[macroName] = {
        fn: option.fn,
        params: params.slice(1)
      }

      return '';
    //调用
    } else {

      var scope = {};
      var macro = macros[macroName];
      var formal = macro.params;

      for (var i = 1; i < params.length; i++) {
        scope[formal[i - 1]] = params[i];
      }

      scopes.unshift(scope);
      return macro.fn(scopes);

    }

  }

  return macro;

});
