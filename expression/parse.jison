/** 
 * 模型求值运算，支持以下表达式
 * 1. 基本属性求值，a a.key a.length
 * 2. 其他运算表达式，支持逻辑运算、比较运算 !a ,  a || b , a && b
 *    a > b , a > 1, a < b, a == b, a >= b
 * 3. 一起基本求值混合，不支持括号运算
 **/

%lex

%%

\d+     { return 'NUMBER' }
\w+     { return 'VAR' }
"."/\w  { return 'DOT' }
"<="    { return yytext }
">="    { return yytext }
"=="    { return yytext }
">"     { return yytext }
"<"     { return yytext }
"!="    { return yytext }
"&&"    { return yytext }
"||"    { return yytext }
"!"     { return yytext }
\s+     { /*ignore whitespace*/ }
<INITIAL><<EOF>> { return 'EOF'; }

/lex

%left '||' '&&'
%left '>=' '<=' '>' '==' '<' '!='
%left '!'

%start expressions

%%

expressions
  : math EOF 
      { return $1; }
  ;

var
  : VAR
    { $$ = { name: $1, path: [] } }
  | var DOT VAR
    { $$ = { name : $1.name, path: $1.path.push($3) } }
  ;

math
  : math '||' math
      { $$ = { l: $1, r: $3, operator: $2 }; }
  | math '&&' math
      { $$ = { l: $1, r: $3, operator: $2 }; }
  | math '>' math
      { $$ = { l: $1, r: $3, operator: $2 }; }
  | math '<' math
      { $$ = { l: $1, r: $3, operator: $2 }; }
  | math '==' math
      { $$ = { l: $1, r: $3, operator: $2 }; }
  | math '>=' math
      { $$ = { l: $1, r: $3, operator: $2 }; }
  | math '<=' math
      { $$ = { l: $1, r: $3, operator: $2 }; }
  | math '!=' math
      { $$ = { l: $1, r: $3, operator: $2 }; }
  | '!' math
      { $$ = { l: $2, operator: 'not' }; }
  | var
      { $$ = $1; }
  | NUMBER
      { $$ = $1; }
  ;
