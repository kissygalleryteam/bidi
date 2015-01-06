%left '||' '&&'
%left '>=' '<=' '>' '===' '==' '<' '!='
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
    { $$ = { name : $1.name, path: $1.path.concat($3) } }
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
  | math '===' math
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
