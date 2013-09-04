KISSY.add(function(S, Parse){

  "use strict";

  //ie 8一下不支持getPrototypeOf方法
  //see http://ejohn.org/blog/objectgetprototypeof
  if ( typeof Object.getPrototypeOf !== "function" ) {
    if ( typeof "test".__proto__ === "object" ) {
      Object.getPrototypeOf = function(object){
        return object.__proto__;
      };
    } else {
      Object.getPrototypeOf = function(object){
        // May break if the constructor has been tampered with
        return object.constructor.prototype;
      };
    }
  }
  

  // 模型求值运算，支持以下表达式
  // 1. 基本属性求值，attrname  attrname.key attrname.length
  // 2. 其他运算表达式，支持逻辑运算、比较运算 !a ,  a || b , a && b
  //    a > b , a > 1, a < b, a == b, a >= b
  // 3. 一起基本求值混合，不支持括号运算

  var cache = {};

  function evaluation($control){

    var ast, related;
    var str = $control('key');
    var model = $control('model');
    var parent = $control('parent');

    /**
     * 对变量求值
     */
    function val(variable){

      if (!variable.path.length) {
        return model.get(variable.name, parent);
      } else {
        var key = variable.name + '.' + variable.path.join('.');
        return model.get(key, parent);
      }

    }

    var cacheKey = parent? parent.name + ':' + parent.id + str : str;
    if (cacheKey in cache) {

      ast = cache[cacheKey].ast;
      related = cache[cacheKey].related;

    } else {

      ast = Parse.parse(str);
      related = getRelated(ast, model, parent);
      cache[cacheKey] = { ast: ast, related: related };

    }

    return { 
      val:  expr(ast, val),
      related: related
    };

  }

  /**
   * 获取相关的属性，比如 a.b > c，和[a, c]的变化有关
   */
  function getRelated(ast, model, parent){

    var ret = [];

    if (!ast.operator) {

      if (ast.name) {

        var str = ast.name;

        if (ast.path.length)
          str += '.' + ast.path.join('.');

        ret = ret.concat(model.getRelated(str, parent));
      }

    } else {

      if (ast.l) ret = ret.concat(getRelated(ast.l, model, parent));
      if (ast.r) ret = ret.concat(getRelated(ast.r, model, parent));

    }

    return ret;

  }

  /**
   * 运算结果，和标准的逻辑求值一样
   */
  function expr(ast, val){

    if (!ast.operator) {

      if (ast.name)  {
        return val(ast);
      } else {
        return parseInt(ast);
      }

    } else {

      switch(ast.operator){

        case '&&':
          return expr(ast.l, val) && expr(ast.r, val);
          break;

        case '||':
          return expr(ast.l, val) || expr(ast.r, val);
          break;

        case 'not':
          var ret = expr(ast.l, val);
          if (S.isArray(ret)) {
            return ret.length === 0;
          } else {
            return !ret;
          }
          break;

        case '===':
          return expr(ast.l, val) === expr(ast.r, val);
          break;

        case '==':
          return expr(ast.l, val) == expr(ast.r, val);
          break;

        case '!=':
          return expr(ast.l, val) != expr(ast.r, val);
          break;

        case '>=':
          return expr(ast.l, val) >= expr(ast.r, val);
          break;

        case '<=':
          return expr(ast.l, val) <= expr(ast.r, val);
          break;

        case '<':
          return expr(ast.l, val) < expr(ast.r, val);
          break;

        case '>':
          return expr(ast.l, val) > expr(ast.r, val);
          break;
      }

    }
  }

  return evaluation;

}, {
  requires: ['./parse']
});
