KISSY.add(function(S){

  // 模型求值运算，支持以下表达式
  // 1. 基本属性求值，attrname  attrname.key attrname.length
  // 2. 其他运算表达式，支持逻辑运算、比较运算 !a ,  a || b , a && b
  //    a > b , a > 1, a < b, a == b, a >= b
  // 3. 一起基本求值混合，不支持括号运算

  var TOKENS = [
    {
      patten: /^\d+/,
      token: 'NUMBER'
    },
    {
      patten: /^\w+/,
      token: 'VAR'
    },
    {
      patten: /^\./,
      token: 'DOT'
    },
    {
      patten: /^(>|<|==|>=|<=)/,
      token: 'COMPARE'
    },
    {
      patten: /^(!|&&|\|\|)/,
      token: 'LOGIC'
    },
    {
      patten: /^\s+/,
      token: null
    }
  ];

  function Lex(str){

    this.index = 0;
    this.str = str;
    this.tokens = [];

    var length = str.length;
    var got = this.loop();

    while (got && this.index < length) {
      got = this.loop();
    }

    return this.tokens;

  }

  Lex.prototype.loop = function(){

    var got = false;
    var index = this.index;

    S.each(TOKENS, function(t){

      var patten = t.patten;
      var strNow = this.str.slice(index);

      if (patten.test && patten.test(strNow)){

        var ret = patten.exec(strNow, 1);
        var len = ret[0].length;
        index += len;

        if (t.token) {
          this.tokens.push({token: t.token, value: ret[0]});
        }

        got = true;

      } 

    }, this);

    this.index = index;

    return got;

  }

  return Lex;

});
