/*
combined files : 

kg/bidi/2.0.0/xtemplate/commands
kg/bidi/2.0.0/xtemplate/runtime
kg/bidi/2.0.0/xtemplate/parser
kg/bidi/2.0.0/xtemplate/ast
kg/bidi/2.0.0/xtemplate/compiler
kg/bidi/2.0.0/xtemplate
kg/bidi/2.0.0/expression/parse
kg/bidi/2.0.0/expression/index
kg/bidi/2.0.0/models
kg/bidi/2.0.0/watch/text
kg/bidi/2.0.0/watch/class
kg/bidi/2.0.0/watch/click
kg/bidi/2.0.0/watch/select
kg/bidi/2.0.0/watch/attr
kg/bidi/2.0.0/watch/each
kg/bidi/2.0.0/watch/radio
kg/bidi/2.0.0/watch/list
kg/bidi/2.0.0/watch/with
kg/bidi/2.0.0/watch/action
kg/bidi/2.0.0/watch/print
kg/bidi/2.0.0/watch/value
kg/bidi/2.0.0/watch/index
kg/bidi/2.0.0/views
kg/bidi/2.0.0/macros
kg/bidi/2.0.0/index

*/

/**
 * native commands for xtemplate.
 * @author yiminghe@gmail.com
 * @ignore
 */
KISSY.add('kg/bidi/2.0.0/xtemplate/commands',function (S) {
    var commands;

    return commands = {
        'each': function (scopes, config) {
            var params = config.params;
            var param0 = params[0];
            var buffer = '';
            var xcount;
            // if undefined, will emit warning by compiler
            if (param0) {
                // skip array check for performance
                var opScopes = [0, 0].concat(scopes);
                if (S.isArray(param0)) {
                    xcount = param0.length;
                    for (var xindex = 0; xindex < xcount; xindex++) {
                        // two more variable scope for array looping
                        opScopes[0] = param0[xindex];
                        opScopes[1] = {
                            xcount: xcount,
                            xindex: xindex
                        };
                        buffer += config.fn(opScopes);
                    }
                } else {
                    for (var name in param0) {
                        opScopes[0] = param0[name];
                        opScopes[1] = {
                            xindex: name
                        };
                        buffer += config.fn(opScopes);
                    }
                }

            } else if (config.inverse) {
                buffer = config.inverse(scopes);
            }
            return buffer;
        },

        'with': function (scopes, config) {
            var params = config.params;
            var param0 = params[0];
            var opScopes = [0].concat(scopes);
            var buffer = '';
            if (param0) {
                // skip object check for performance
                opScopes[0] = param0;
                buffer = config.fn(opScopes);
            } else if (config.inverse) {
                buffer = config.inverse(scopes);
            }
            return buffer;
        },

        'if': function (scopes, config) {
            var params = config.params;
            var param0 = params[0];
            var buffer = '';
            if (param0) {
                if (config.fn) {
                    buffer = config.fn(scopes);
                }
            } else if (config.inverse) {
                buffer = config.inverse(scopes);
            }
            return buffer;
        },

        'set': function (scopes, config) {
            // in case scopes[0] is not object ,{{#each}}{{set }}{{/each}}
            for (var i = scopes.length - 1; i >= 0; i--) {
                if (typeof scopes[i] == 'object') {
                    S.mix(scopes[i], config.hash);
                    break;
                }
            }
            return '';
        },

        include: function (scopes, config) {
            var params = config.params;
            // allow hash to shadow parent scopes
            var extra = config.hash ? [config.hash] : [];
            scopes = extra.concat(scopes);

            if (!params || params.length != 1) {
                S.error('include must has one param');
                return '';
            }

            var myName = this.config.name;
            var subTplName = params[0];


            if (subTplName.charAt(0) == '.') {
                if (myName == 'unspecified') {
                    S.error('parent template does not have name' + ' for relative sub tpl name: ' + subTplName);
                    return '';
                }
                subTplName = S.Path.resolve(myName, '../', subTplName);
            }

            var tpl = this.config.loader.call(this, subTplName);

            config = S.merge(this.config);
            // template file name
            config.name = subTplName;
            // pass commands to sub template
            config.commands = this.config.commands;
            // share macros with parent template and sub template
            config.macros = this.config.macros;
            return this.invokeEngine(tpl, scopes, config)
        },

        'macro': function (scopes, config) {
            var params = config.params;
            var macroName = params[0];
            var params1 = params.slice(1);
            var macros = this.config.macros;
            // definition
            if (config.fn) {
                // parent template override child template
                if (!macros[macroName]) {
                    macros[macroName] = {
                        paramNames: params1,
                        fn: config.fn
                    };
                }
            } else {
                var paramValues = {};
                var macro = macros[macroName];
                if (!macro) {
                    macro = S.require(macroName);
                    if (!macro) {
                        S.error("can not find macro module:" + name);
                    }
                }
                S.each(macro.paramNames, function (p, i) {
                    paramValues[p] = params1[i];
                });
                var newScopes = scopes.concat();
                newScopes.unshift(paramValues);
                return macro.fn.call(this, newScopes);
            }
            return '';
        },

        parse: function (scopes, config) {
            // abandon parent scopes
            return commands.include.call(this, [], config);
        }
    };
});

/*
Copyright 2013, KISSY v1.40dev
MIT Licensed
build time: Sep 17 23:11
*/
/**
 * xtemplate runtime
 * @author yiminghe@gmail.com
 * @ignore
 */
KISSY.add('kg/bidi/2.0.0/xtemplate/runtime',function (S, commands, undefined) {
    var escapeHtml = S.escapeHtml;
    var logger = S.getLogger('s/xtemplate');

    function info(s) {
        logger.info(s);
    }

    function findCommand(commands, name) {
        var parts = name.split('.');
        var cmd = commands;
        var len = parts.length;
        for (var i = 0; i < len; i++) {
            cmd = cmd[parts[i]];
            if (!cmd) {
                break;
            }
        }
        return cmd;
    }

    function getProperty(parts, scopes, depth) {
        // this refer to current scope object
        if (parts === '.') {
            parts = 'this';
        }
        parts = parts.split('.');
        var len = parts.length,
            i,
            j = depth || 0,
            v,
            p,
            valid,
            sl = scopes.length;
        // root keyword for root scope
        if (parts[0] == 'root') {
            j = sl - 1;
            parts.shift();
            len--;
        }
        for (; j < sl; j++) {
            v = scopes[j];
            valid = 1;
            for (i = 0; i < len; i++) {
                p = parts[i];
                if (p === 'this') {
                    continue;
                }
                // may not be object at all
                else if (typeof v != 'object' || !(p in v)) {
                    valid = 0;
                    break;
                }
                v = v[p];
            }
            if (valid) {
                // support property function return value as property value
                if (typeof v == 'function') {
                    v = v.call(scopes[0]);
                }
                return [v];
            }
        }
        return false;
    }

    var utils = {
            'runBlockCommand': function (engine, scopes, options, name, line) {
                var config = engine.config;
                var logFn = config.silent ? info : S.error;
                var commands = config.commands;
                var command = findCommand(commands, name);
                if (!command) {
                    if (!options.params && !options.hash) {
                        var property = getProperty(name, scopes);
                        if (property === false) {
                            logFn("can not find property: '" + name + "' at line " + line);
                            property = '';
                        } else {
                            property = property[0];
                        }
                        command = commands['if'];
                        if (S.isArray(property)) {
                            command = commands.each;
                        }
                        else if (typeof property == 'object') {
                            command = commands['with'];
                        }
                        options.params = [property];
                    } else {
                        S.error("can not find command module: " + name + "' at line " + line);
                        return '';
                    }
                }
                var ret = '';
                try {
                    ret = command.call(engine, scopes, options);
                } catch (e) {
                    S.error(e.message + ": '" + name + "' at line " + line);
                }
                if (ret === undefined) {
                    ret = '';
                }
                return ret;
            },

            'getExpression': function (exp, escaped) {
                if (exp === undefined) {
                    exp = '';
                }
                return escaped && exp ? escapeHtml(exp) : exp;
            },

            'getPropertyOrRunCommand': function (engine, scopes, options, name, depth, line, escape, preserveUndefined) {
                var id0;
                var config = engine.config;
                var commands = config.commands;
                var command1 = findCommand(commands, name);
                var logFn = config.silent ? info : S.error;
                if (command1) {
                    try {
                        id0 = command1.call(engine, scopes, options);
                    } catch (e) {
                        S.error(e.message + ": '" + name + "' at line " + line);
                        return '';
                    }
                }
                else {
                    var tmp2 = getProperty(name, scopes, depth);
                    if (tmp2 === false) {
                        logFn("can not find property: '" +
                            name + "' at line " + line, "warn");
                        // undefined for expression
                        // {{n+2}}
                        return preserveUndefined ? undefined : '';
                    } else {
                        id0 = tmp2[0];
                    }
                }
                if (!preserveUndefined && id0 === undefined) {
                    id0 = '';
                }
                return escape && id0 ? escapeHtml(id0) : id0;
            }
        },

        defaultConfig = {

            /**
             * whether throw exception when template variable is not found in data
             *
             * or
             *
             * command is not found
             *
             *
             *      '{{title}}'.render({t2:0})
             *
             *
             * @cfg {Boolean} silent
             * @member KISSY.XTemplate.Runtime
             */
            silent: true,

            /**
             * template file name for chrome debug
             *
             * @cfg {Boolean} name
             * @member KISSY.XTemplate.Runtime
             */
            name: 'unspecified',

            /**
             * tpl loader to load sub tpl by name
             * @cfg {Function} loader
             * @member KISSY.XTemplate.Runtime
             */
            loader: function (subTplName) {
                var tpl = S.require(subTplName);
                if (!tpl) {
                    S.error('template "' + subTplName + '" does not exist, ' + 'need to be required or used first!');
                }
                return tpl;
            }

        };

    /**
     * XTemplate runtime. only accept tpl as function.
     *
     *
     *      @example
     *      KISSY.use('xtemplate/runtime',function(S, XTemplateRunTime){
     *          document.writeln(
     *              new XTemplateRunTime(function(scopes){ return scopes[0].title;}).render({title:2})
     *          );
     *      });
     *
     * @class KISSY.XTemplate.Runtime
     */
    function XTemplateRuntime(tpl, config) {
        var self = this;
        self.tpl = tpl;
        config = S.merge(defaultConfig, config);
        config.commands = S.merge(config.commands, commands);
        config.utils = utils;
        config.macros = config.macros || {};
        this.config = config;
    }

    S.mix(XTemplateRuntime, {
        commands: commands,

        utils: utils,

        /**
         * add command to all template
         * @method
         * @static
         * @param {String} commandName
         * @param {Function} fn
         * @member KISSY.XTemplate.Runtime
         */
        addCommand: function (commandName, fn) {
            commands[commandName] = fn;
        },

        /**
         * remove command from all template by name
         * @method
         * @static
         * @param {String} commandName
         * @member KISSY.XTemplate.Runtime
         */
        removeCommand: function (commandName) {
            delete commands[commandName];
        }
    });

    XTemplateRuntime.prototype = {
        constructor: XTemplateRuntime,

        // allow str sub template
        invokeEngine: function (tpl, scopes, config) {
            return new this.constructor(tpl, config).render(scopes, true);
        },

        /**
         * remove command by name
         * @param commandName
         */
        'removeCommand': function (commandName) {
            delete this.config.commands[commandName];
        },

        /**
         * add command definition to current template
         * @param commandName
         * @param {Function} fn command definition
         */
        addCommand: function (commandName, fn) {
            this.config.commands[commandName] = fn;
        },

        /**
         * get result by merge data with template
         * @param data
         * @return {String}
         * @param {Boolean} [keepDataFormat] for internal use
         */
        render: function (data, keepDataFormat) {
            if (!keepDataFormat) {
                data = [data];
            }
            return this.tpl(data, S);
        }
    };

    return XTemplateRuntime;
}, {
    requires: [ './commands']
});

/**
 * @ignore
 *
 * 2012-09-12 yiminghe@gmail.com
 *  - 参考 velocity, 扩充 ast
 *          - Expression/ConditionalOrExpression
 *          - EqualityExpression/RelationalExpression...
 *
 * 2012-09-11 yiminghe@gmail.com
 *  - 初步完成，添加 tc
 *
 * 对比 template
 *
 *  优势
 *      - 不会莫名其妙报错（with）
 *      - 更多出错信息，直接给出行号
 *      - 更容易扩展 command,sub-tpl
 *      - 支持子模板
 *      - 支持作用域链: ..\x ..\..\y
 *      - 内置 escapeHtml 支持
 *      - 支持预编译
 *      - 支持简单表达式 +-/%* ()
 *      - 支持简单比较 === !===
 *   劣势
 *      - 不支持表达式
 *      - 不支持复杂比较操作
 *      - 不支持 js 语法
 *
 */



/* Generated by kissy-kison.*/
KISSY.add('kg/bidi/2.0.0/xtemplate/parser',function () {
    /* Generated by kison from KISSY */
    var parser = {}, S = KISSY,
        GrammarConst = {
            'SHIFT_TYPE': 1,
            'REDUCE_TYPE': 2,
            'ACCEPT_TYPE': 0,
            'TYPE_INDEX': 0,
            'PRODUCTION_INDEX': 1,
            'TO_INDEX': 2
        };
    var Lexer = function (cfg) {

        var self = this;

        /*
         lex rules.
         @type {Object[]}
         @example
         [
         {
         regexp:'\\w+',
         state:['xx'],
         token:'c',
         // this => lex
         action:function(){}
         }
         ]
         */
        self.rules = [];

        S.mix(self, cfg);

        /*
         Input languages
         @type {String}
         */

        self.resetInput(self.input);

    };
    Lexer.prototype = {
        'constructor': function (cfg) {

            var self = this;

            /*
             lex rules.
             @type {Object[]}
             @example
             [
             {
             regexp:'\\w+',
             state:['xx'],
             token:'c',
             // this => lex
             action:function(){}
             }
             ]
             */
            self.rules = [];

            S.mix(self, cfg);

            /*
             Input languages
             @type {String}
             */

            self.resetInput(self.input);

        },
        'resetInput': function (input) {
            S.mix(this, {
                input: input,
                matched: "",
                stateStack: [Lexer.STATIC.INITIAL],
                match: "",
                text: "",
                firstLine: 1,
                lineNumber: 1,
                lastLine: 1,
                firstColumn: 1,
                lastColumn: 1
            });
        },
        'getCurrentRules': function () {
            var self = this,
                currentState = self.stateStack[self.stateStack.length - 1],
                rules = [];
            currentState = self.mapState(currentState);
            S.each(self.rules, function (r) {
                var state = r.state || r[3];
                if (!state) {
                    if (currentState == Lexer.STATIC.INITIAL) {
                        rules.push(r);
                    }
                } else if (S.inArray(currentState, state)) {
                    rules.push(r);
                }
            });
            return rules;
        },
        'pushState': function (state) {
            this.stateStack.push(state);
        },
        'popState': function () {
            return this.stateStack.pop();
        },
        'getStateStack': function () {
            return this.stateStack;
        },
        'showDebugInfo': function () {
            var self = this,
                DEBUG_CONTEXT_LIMIT = Lexer.STATIC.DEBUG_CONTEXT_LIMIT,
                matched = self.matched,
                match = self.match,
                input = self.input;
            matched = matched.slice(0, matched.length - match.length);
            var past = (matched.length > DEBUG_CONTEXT_LIMIT ? "..." : "") + matched.slice(-DEBUG_CONTEXT_LIMIT).replace(/\n/, " "),
                next = match + input;
            next = next.slice(0, DEBUG_CONTEXT_LIMIT) + (next.length > DEBUG_CONTEXT_LIMIT ? "..." : "");
            return past + next + "\n" + new Array(past.length + 1).join("-") + "^";
        },
        'mapSymbol': function (t) {
            var self = this,
                symbolMap = self.symbolMap;
            if (!symbolMap) {
                return t;
            }
            return symbolMap[t] || (symbolMap[t] = (++self.symbolId));
        },
        'mapReverseSymbol': function (rs) {
            var self = this,
                symbolMap = self.symbolMap,
                i,
                reverseSymbolMap = self.reverseSymbolMap;
            if (!reverseSymbolMap && symbolMap) {
                reverseSymbolMap = self.reverseSymbolMap = {};
                for (i in symbolMap) {
                    reverseSymbolMap[symbolMap[i]] = i;
                }
            }
            if (reverseSymbolMap) {
                return reverseSymbolMap[rs];
            } else {
                return rs;
            }
        },
        'mapState': function (s) {
            var self = this,
                stateMap = self.stateMap;
            if (!stateMap) {
                return s;
            }
            return stateMap[s] || (stateMap[s] = (++self.stateId));
        },
        'lex': function () {
            var self = this,
                input = self.input,
                i,
                rule,
                m,
                ret,
                lines,
                rules = self.getCurrentRules();

            self.match = self.text = "";

            if (!input) {
                return self.mapSymbol(Lexer.STATIC.END_TAG);
            }

            for (i = 0; i < rules.length; i++) {
                rule = rules[i];
                var regexp = rule.regexp || rule[1],
                    token = rule.token || rule[0],
                    action = rule.action || rule[2] || undefined;
                if (m = input.match(regexp)) {
                    lines = m[0].match(/\n.*/g);
                    if (lines) {
                        self.lineNumber += lines.length;
                    }
                    S.mix(self, {
                        firstLine: self.lastLine,
                        lastLine: self.lineNumber + 1,
                        firstColumn: self.lastColumn,
                        lastColumn: lines ? lines[lines.length - 1].length - 1 : self.lastColumn + m[0].length
                    });
                    var match;
                    // for error report
                    match = self.match = m[0];

                    // all matches
                    self.matches = m;
                    // may change by user
                    self.text = match;
                    // matched content utils now
                    self.matched += match;
                    ret = action && action.call(self);
                    if (ret == undefined) {
                        ret = token;
                    } else {
                        ret = self.mapSymbol(ret);
                    }
                    input = input.slice(match.length);
                    self.input = input;

                    if (ret) {
                        return ret;
                    } else {
                        // ignore
                        return self.lex();
                    }
                }
            }

            S.error("lex error at line " + self.lineNumber + ":\n" + self.showDebugInfo());
            return undefined;
        }
    };
    Lexer.STATIC = {
        'INITIAL': 'I',
        'DEBUG_CONTEXT_LIMIT': 20,
        'END_TAG': '$EOF'
    };
    var lexer = new Lexer({
        'rules': [
            [0, /^[\s\S]*?(?={{)/, function () {
                var self = this,
                    text = self.text,
                    m,
                    n = 0;
                if (m = text.match(/\\+$/)) {
                    n = m[0].length;
                }
                if (n % 2) {
                    self.pushState('et');
                } else {
                    self.pushState('t');
                }
                if (n) {
                    text = text.slice(0, -1);
                }
                // https://github.com/kissyteam/kissy/issues/330
                // return even empty
                self.text = text;
                return 'CONTENT';
            }],
            [2, /^[\s\S]+/, 0],
            [2, /^[\s\S]{2,}?(?:(?={{)|$)/, function popState() {
                this.popState();
            }, ['et']],
            [3, /^{{(?:#|@|\^)/, 0, ['t']],
            [4, /^{{\//, 0, ['t']],
            [5, /^{{\s*else\s*}}/, function popState() {
                this.popState();
            }, ['t']],
            [0, /^{{![\s\S]*?}}/, function popState() {
                this.popState();
            }, ['t']],
            [2, /^{{%([\s\S]*?)%}}/, function () {
                // return to content mode
                this.text = this.matches[1] || '';
                this.popState();
            }, ['t']],
            [6, /^{{{?/, 0, ['t']],
            [0, /^\s+/, 0, ['t']],
            [7, /^}}}?/, function popState() {
                this.popState();
            }, ['t']],
            [8, /^\(/, 0, ['t']],
            [9, /^\)/, 0, ['t']],
            [10, /^\|\|/, 0, ['t']],
            [11, /^&&/, 0, ['t']],
            [12, /^===/, 0, ['t']],
            [13, /^!==/, 0, ['t']],
            [15, /^>=/, 0, ['t']],
            [17, /^<=/, 0, ['t']],
            [14, /^>/, 0, ['t']],
            [16, /^</, 0, ['t']],
            [18, /^\+/, 0, ['t']],
            [19, /^-/, 0, ['t']],
            [20, /^\*/, 0, ['t']],
            [21, /^\//, 0, ['t']],
            [22, /^%/, 0, ['t']],
            [23, /^!/, 0, ['t']],
            [24, /^"(\\[\s\S]|[^"])*"/, function () {
                this.text = this.text.slice(1, -1).replace(/\\"/g, '"');
            }, ['t']],
            [24, /^'(\\[\s\S]|[^'])*'/, function () {
                this.text = this.text.slice(1, -1).replace(/\\'/g, "'");
            }, ['t']],
            [25, /^true/, 0, ['t']],
            [25, /^false/, 0, ['t']],
            [26, /^\d+(?:\.\d+)?(?:e-?\d+)?/i, 0, ['t']],
            [27, /^=/, 0, ['t']],
            [28, /^\.(?=})/, 0, ['t']],
            [28, /^\.\./, function () {
                // wait for '/'
                this.pushState('ws');
            }, ['t']],
            [29, /^\//, function popState() {
                this.popState();
            }, ['ws']],
            [29, /^\./, 0, ['t']],
            [30, /^\[/, 0, ['t']],
            [31, /^\]/, 0, ['t']],
            [28, /^[a-zA-Z0-9_$]+/, 0, ['t']],
            [32, /^./, 0, ['t']]
        ]
    });
    parser.lexer = lexer;
    lexer.symbolMap = {
        '$EOF': 1,
        'CONTENT': 2,
        'OPEN_BLOCK': 3,
        'OPEN_CLOSE_BLOCK': 4,
        'INVERSE': 5,
        'OPEN_TPL': 6,
        'CLOSE': 7,
        'LPAREN': 8,
        'RPAREN': 9,
        'OR': 10,
        'AND': 11,
        'LOGIC_EQUALS': 12,
        'LOGIC_NOT_EQUALS': 13,
        'GT': 14,
        'GE': 15,
        'LT': 16,
        'LE': 17,
        'PLUS': 18,
        'MINUS': 19,
        'MULTIPLY': 20,
        'DIVIDE': 21,
        'MODULUS': 22,
        'NOT': 23,
        'STRING': 24,
        'BOOLEAN': 25,
        'NUMBER': 26,
        'EQUALS': 27,
        'ID': 28,
        'SEP': 29,
        'REF_START': 30,
        'REF_END': 31,
        'INVALID': 32,
        '$START': 33,
        'program': 34,
        'statements': 35,
        'statement': 36,
        'openBlock': 37,
        'closeBlock': 38,
        'tpl': 39,
        'inBlockTpl': 40,
        'path': 41,
        'inTpl': 42,
        'Expression': 43,
        'params': 44,
        'hash': 45,
        'param': 46,
        'ConditionalOrExpression': 47,
        'ConditionalAndExpression': 48,
        'EqualityExpression': 49,
        'RelationalExpression': 50,
        'AdditiveExpression': 51,
        'MultiplicativeExpression': 52,
        'UnaryExpression': 53,
        'PrimaryExpression': 54,
        'hashSegments': 55,
        'hashSegment': 56,
        'pathSegments': 57
    };
    parser.productions = [
        [33, [34]],
        [34, [35, 5, 35], function () {
            return new this.yy.ProgramNode(this.lexer.lineNumber, this.$1, this.$3);
        }],
        [34, [35], function () {
            return new this.yy.ProgramNode(this.lexer.lineNumber, this.$1);
        }],
        [35, [36], function () {
            return [this.$1];
        }],
        [35, [35, 36], function () {
            this.$1.push(this.$2);
        }],
        [36, [37, 34, 38], function () {
            return new this.yy.BlockNode(this.lexer.lineNumber, this.$1, this.$2, this.$3);
        }],
        [36, [39]],
        [36, [2], function () {
            return new this.yy.ContentNode(this.lexer.lineNumber, this.$1);
        }],
        [40, [41], function () {
            return new this.yy.TplNode(this.lexer.lineNumber, this.$1);
        }],
        [40, [42]],
        [37, [3, 40, 7], function () {
            if (this.$1.charAt(this.$1.length - 1) == '^') {
                this.$2['isInverted'] = 1;
            }
            return this.$2;
        }],
        [38, [4, 41, 7], function () {
            return this.$2;
        }],
        [39, [6, 42, 7], function () {
            if (this.$1.length === 3) {
                this.$2.escaped = false;
            }
            return this.$2;
        }],
        [39, [6, 43, 7], function () {
            var tpl = new this.yy.TplExpressionNode(this.lexer.lineNumber,
                this.$2);
            if (this.$1.length === 3) {
                tpl.escaped = false;
            }
            return tpl;
        }],
        [42, [41, 44, 45], function () {
            return new this.yy.TplNode(this.lexer.lineNumber, this.$1, this.$2, this.$3);
        }],
        [42, [41, 44], function () {
            return new this.yy.TplNode(this.lexer.lineNumber, this.$1, this.$2);
        }],
        [42, [41, 45], function () {
            return new this.yy.TplNode(this.lexer.lineNumber, this.$1, null, this.$2);
        }],
        [44, [44, 46], function () {
            this.$1.push(this.$2);
        }],
        [44, [46], function () {
            return [this.$1];
        }],
        [46, [43]],
        [43, [47]],
        [47, [48]],
        [47, [47, 10, 48], function () {
            return new this.yy.ConditionalOrExpression(this.$1, this.$3);
        }],
        [48, [49]],
        [48, [48, 11, 49], function () {
            return new this.yy.ConditionalAndExpression(this.$1, this.$3);
        }],
        [49, [50]],
        [49, [49, 12, 50], function () {
            return new this.yy.EqualityExpression(this.$1, '===', this.$3);
        }],
        [49, [49, 13, 50], function () {
            return new this.yy.EqualityExpression(this.$1, '!==', this.$3);
        }],
        [50, [51]],
        [50, [50, 16, 51], function () {
            return new this.yy.RelationalExpression(this.$1, '<', this.$3);
        }],
        [50, [50, 14, 51], function () {
            return new this.yy.RelationalExpression(this.$1, '>', this.$3);
        }],
        [50, [50, 17, 51], function () {
            return new this.yy.RelationalExpression(this.$1, '<=', this.$3);
        }],
        [50, [50, 15, 51], function () {
            return new this.yy.RelationalExpression(this.$1, '>=', this.$3);
        }],
        [51, [52]],
        [51, [51, 18, 52], function () {
            return new this.yy.AdditiveExpression(this.$1, '+', this.$3);
        }],
        [51, [51, 19, 52], function () {
            return new this.yy.AdditiveExpression(this.$1, '-', this.$3);
        }],
        [52, [53]],
        [52, [52, 20, 53], function () {
            return new this.yy.MultiplicativeExpression(this.$1, '*', this.$3);
        }],
        [52, [52, 21, 53], function () {
            return new this.yy.MultiplicativeExpression(this.$1, '/', this.$3);
        }],
        [52, [52, 22, 53], function () {
            return new this.yy.MultiplicativeExpression(this.$1, '%', this.$3);
        }],
        [53, [23, 53], function () {
            return new this.yy.UnaryExpression(this.$1);
        }],
        [53, [54]],
        [54, [24], function () {
            return new this.yy.StringNode(this.lexer.lineNumber, this.$1);
        }],
        [54, [26], function () {
            return new this.yy.NumberNode(this.lexer.lineNumber, this.$1);
        }],
        [54, [25], function () {
            return new this.yy.BooleanNode(this.lexer.lineNumber, this.$1);
        }],
        [54, [41]],
        [54, [8, 43, 9], function () {
            return this.$2;
        }],
        [45, [55], function () {
            return new this.yy.HashNode(this.lexer.lineNumber, this.$1);
        }],
        [55, [55, 56], function () {
            this.$1.push(this.$2);
        }],
        [55, [56], function () {
            return [this.$1];
        }],
        [56, [28, 27, 43], function () {
            return [this.$1, this.$3];
        }],
        [41, [57], function () {
            return new this.yy.IdNode(this.lexer.lineNumber, this.$1);
        }],
        [57, [57, 29, 28], function () {
            this.$1.push(this.$3);
        }],
        [57, [57, 30, 43, 31], function () {
            this.$1.push(this.$3);
        }],
        [57, [57, 29, 26], function () {
            this.$1.push(this.$3);
        }],
        [57, [28], function () {
            return [this.$1];
        }]
    ];
    parser.table = {
        'gotos': {
            '0': {
                '34': 4,
                '35': 5,
                '36': 6,
                '37': 7,
                '39': 8
            },
            '2': {
                '40': 10,
                '41': 11,
                '42': 12,
                '57': 13
            },
            '3': {
                '41': 19,
                '42': 20,
                '43': 21,
                '47': 22,
                '48': 23,
                '49': 24,
                '50': 25,
                '51': 26,
                '52': 27,
                '53': 28,
                '54': 29,
                '57': 13
            },
            '5': {
                '36': 31,
                '37': 7,
                '39': 8
            },
            '7': {
                '34': 32,
                '35': 5,
                '36': 6,
                '37': 7,
                '39': 8
            },
            '11': {
                '41': 35,
                '43': 36,
                '44': 37,
                '45': 38,
                '46': 39,
                '47': 22,
                '48': 23,
                '49': 24,
                '50': 25,
                '51': 26,
                '52': 27,
                '53': 28,
                '54': 29,
                '55': 40,
                '56': 41,
                '57': 13
            },
            '14': {
                '41': 35,
                '43': 44,
                '47': 22,
                '48': 23,
                '49': 24,
                '50': 25,
                '51': 26,
                '52': 27,
                '53': 28,
                '54': 29,
                '57': 13
            },
            '15': {
                '41': 35,
                '53': 45,
                '54': 29,
                '57': 13
            },
            '19': {
                '41': 35,
                '43': 36,
                '44': 37,
                '45': 38,
                '46': 39,
                '47': 22,
                '48': 23,
                '49': 24,
                '50': 25,
                '51': 26,
                '52': 27,
                '53': 28,
                '54': 29,
                '55': 40,
                '56': 41,
                '57': 13
            },
            '30': {
                '35': 61,
                '36': 6,
                '37': 7,
                '39': 8
            },
            '32': {
                '38': 63
            },
            '37': {
                '41': 35,
                '43': 36,
                '45': 65,
                '46': 66,
                '47': 22,
                '48': 23,
                '49': 24,
                '50': 25,
                '51': 26,
                '52': 27,
                '53': 28,
                '54': 29,
                '55': 40,
                '56': 41,
                '57': 13
            },
            '40': {
                '56': 68
            },
            '43': {
                '41': 35,
                '43': 71,
                '47': 22,
                '48': 23,
                '49': 24,
                '50': 25,
                '51': 26,
                '52': 27,
                '53': 28,
                '54': 29,
                '57': 13
            },
            '48': {
                '41': 35,
                '48': 73,
                '49': 24,
                '50': 25,
                '51': 26,
                '52': 27,
                '53': 28,
                '54': 29,
                '57': 13
            },
            '49': {
                '41': 35,
                '49': 74,
                '50': 25,
                '51': 26,
                '52': 27,
                '53': 28,
                '54': 29,
                '57': 13
            },
            '50': {
                '41': 35,
                '50': 75,
                '51': 26,
                '52': 27,
                '53': 28,
                '54': 29,
                '57': 13
            },
            '51': {
                '41': 35,
                '50': 76,
                '51': 26,
                '52': 27,
                '53': 28,
                '54': 29,
                '57': 13
            },
            '52': {
                '41': 35,
                '51': 77,
                '52': 27,
                '53': 28,
                '54': 29,
                '57': 13
            },
            '53': {
                '41': 35,
                '51': 78,
                '52': 27,
                '53': 28,
                '54': 29,
                '57': 13
            },
            '54': {
                '41': 35,
                '51': 79,
                '52': 27,
                '53': 28,
                '54': 29,
                '57': 13
            },
            '55': {
                '41': 35,
                '51': 80,
                '52': 27,
                '53': 28,
                '54': 29,
                '57': 13
            },
            '56': {
                '41': 35,
                '52': 81,
                '53': 28,
                '54': 29,
                '57': 13
            },
            '57': {
                '41': 35,
                '52': 82,
                '53': 28,
                '54': 29,
                '57': 13
            },
            '58': {
                '41': 35,
                '53': 83,
                '54': 29,
                '57': 13
            },
            '59': {
                '41': 35,
                '53': 84,
                '54': 29,
                '57': 13
            },
            '60': {
                '41': 35,
                '53': 85,
                '54': 29,
                '57': 13
            },
            '61': {
                '36': 31,
                '37': 7,
                '39': 8
            },
            '62': {
                '41': 86,
                '57': 13
            },
            '64': {
                '41': 35,
                '43': 87,
                '47': 22,
                '48': 23,
                '49': 24,
                '50': 25,
                '51': 26,
                '52': 27,
                '53': 28,
                '54': 29,
                '57': 13
            }
        },
        'action': {
            '0': {
                '2': [1, undefined, 1],
                '3': [1, undefined, 2],
                '6': [1, undefined, 3]
            },
            '1': {
                '1': [2, 7],
                '2': [2, 7],
                '3': [2, 7],
                '4': [2, 7],
                '5': [2, 7],
                '6': [2, 7]
            },
            '2': {
                '28': [1, undefined, 9]
            },
            '3': {
                '8': [1, undefined, 14],
                '23': [1, undefined, 15],
                '24': [1, undefined, 16],
                '25': [1, undefined, 17],
                '26': [1, undefined, 18],
                '28': [1, undefined, 9]
            },
            '4': {
                '1': [0]
            },
            '5': {
                '1': [2, 2],
                '2': [1, undefined, 1],
                '3': [1, undefined, 2],
                '4': [2, 2],
                '5': [1, undefined, 30],
                '6': [1, undefined, 3]
            },
            '6': {
                '1': [2, 3],
                '2': [2, 3],
                '3': [2, 3],
                '4': [2, 3],
                '5': [2, 3],
                '6': [2, 3]
            },
            '7': {
                '2': [1, undefined, 1],
                '3': [1, undefined, 2],
                '6': [1, undefined, 3]
            },
            '8': {
                '1': [2, 6],
                '2': [2, 6],
                '3': [2, 6],
                '4': [2, 6],
                '5': [2, 6],
                '6': [2, 6]
            },
            '9': {
                '7': [2, 55],
                '8': [2, 55],
                '9': [2, 55],
                '10': [2, 55],
                '11': [2, 55],
                '12': [2, 55],
                '13': [2, 55],
                '14': [2, 55],
                '15': [2, 55],
                '16': [2, 55],
                '17': [2, 55],
                '18': [2, 55],
                '19': [2, 55],
                '20': [2, 55],
                '21': [2, 55],
                '22': [2, 55],
                '23': [2, 55],
                '24': [2, 55],
                '25': [2, 55],
                '26': [2, 55],
                '28': [2, 55],
                '29': [2, 55],
                '30': [2, 55],
                '31': [2, 55]
            },
            '10': {
                '7': [1, undefined, 33]
            },
            '11': {
                '7': [2, 8],
                '8': [1, undefined, 14],
                '23': [1, undefined, 15],
                '24': [1, undefined, 16],
                '25': [1, undefined, 17],
                '26': [1, undefined, 18],
                '28': [1, undefined, 34]
            },
            '12': {
                '7': [2, 9]
            },
            '13': {
                '7': [2, 51],
                '8': [2, 51],
                '9': [2, 51],
                '10': [2, 51],
                '11': [2, 51],
                '12': [2, 51],
                '13': [2, 51],
                '14': [2, 51],
                '15': [2, 51],
                '16': [2, 51],
                '17': [2, 51],
                '18': [2, 51],
                '19': [2, 51],
                '20': [2, 51],
                '21': [2, 51],
                '22': [2, 51],
                '23': [2, 51],
                '24': [2, 51],
                '25': [2, 51],
                '26': [2, 51],
                '28': [2, 51],
                '29': [1, undefined, 42],
                '30': [1, undefined, 43],
                '31': [2, 51]
            },
            '14': {
                '8': [1, undefined, 14],
                '23': [1, undefined, 15],
                '24': [1, undefined, 16],
                '25': [1, undefined, 17],
                '26': [1, undefined, 18],
                '28': [1, undefined, 9]
            },
            '15': {
                '8': [1, undefined, 14],
                '23': [1, undefined, 15],
                '24': [1, undefined, 16],
                '25': [1, undefined, 17],
                '26': [1, undefined, 18],
                '28': [1, undefined, 9]
            },
            '16': {
                '7': [2, 42],
                '8': [2, 42],
                '9': [2, 42],
                '10': [2, 42],
                '11': [2, 42],
                '12': [2, 42],
                '13': [2, 42],
                '14': [2, 42],
                '15': [2, 42],
                '16': [2, 42],
                '17': [2, 42],
                '18': [2, 42],
                '19': [2, 42],
                '20': [2, 42],
                '21': [2, 42],
                '22': [2, 42],
                '23': [2, 42],
                '24': [2, 42],
                '25': [2, 42],
                '26': [2, 42],
                '28': [2, 42],
                '31': [2, 42]
            },
            '17': {
                '7': [2, 44],
                '8': [2, 44],
                '9': [2, 44],
                '10': [2, 44],
                '11': [2, 44],
                '12': [2, 44],
                '13': [2, 44],
                '14': [2, 44],
                '15': [2, 44],
                '16': [2, 44],
                '17': [2, 44],
                '18': [2, 44],
                '19': [2, 44],
                '20': [2, 44],
                '21': [2, 44],
                '22': [2, 44],
                '23': [2, 44],
                '24': [2, 44],
                '25': [2, 44],
                '26': [2, 44],
                '28': [2, 44],
                '31': [2, 44]
            },
            '18': {
                '7': [2, 43],
                '8': [2, 43],
                '9': [2, 43],
                '10': [2, 43],
                '11': [2, 43],
                '12': [2, 43],
                '13': [2, 43],
                '14': [2, 43],
                '15': [2, 43],
                '16': [2, 43],
                '17': [2, 43],
                '18': [2, 43],
                '19': [2, 43],
                '20': [2, 43],
                '21': [2, 43],
                '22': [2, 43],
                '23': [2, 43],
                '24': [2, 43],
                '25': [2, 43],
                '26': [2, 43],
                '28': [2, 43],
                '31': [2, 43]
            },
            '19': {
                '7': [2, 45],
                '8': [1, undefined, 14],
                '10': [2, 45],
                '11': [2, 45],
                '12': [2, 45],
                '13': [2, 45],
                '14': [2, 45],
                '15': [2, 45],
                '16': [2, 45],
                '17': [2, 45],
                '18': [2, 45],
                '19': [2, 45],
                '20': [2, 45],
                '21': [2, 45],
                '22': [2, 45],
                '23': [1, undefined, 15],
                '24': [1, undefined, 16],
                '25': [1, undefined, 17],
                '26': [1, undefined, 18],
                '28': [1, undefined, 34]
            },
            '20': {
                '7': [1, undefined, 46]
            },
            '21': {
                '7': [1, undefined, 47]
            },
            '22': {
                '7': [2, 20],
                '8': [2, 20],
                '9': [2, 20],
                '10': [1, undefined, 48],
                '23': [2, 20],
                '24': [2, 20],
                '25': [2, 20],
                '26': [2, 20],
                '28': [2, 20],
                '31': [2, 20]
            },
            '23': {
                '7': [2, 21],
                '8': [2, 21],
                '9': [2, 21],
                '10': [2, 21],
                '11': [1, undefined, 49],
                '23': [2, 21],
                '24': [2, 21],
                '25': [2, 21],
                '26': [2, 21],
                '28': [2, 21],
                '31': [2, 21]
            },
            '24': {
                '7': [2, 23],
                '8': [2, 23],
                '9': [2, 23],
                '10': [2, 23],
                '11': [2, 23],
                '12': [1, undefined, 50],
                '13': [1, undefined, 51],
                '23': [2, 23],
                '24': [2, 23],
                '25': [2, 23],
                '26': [2, 23],
                '28': [2, 23],
                '31': [2, 23]
            },
            '25': {
                '7': [2, 25],
                '8': [2, 25],
                '9': [2, 25],
                '10': [2, 25],
                '11': [2, 25],
                '12': [2, 25],
                '13': [2, 25],
                '14': [1, undefined, 52],
                '15': [1, undefined, 53],
                '16': [1, undefined, 54],
                '17': [1, undefined, 55],
                '23': [2, 25],
                '24': [2, 25],
                '25': [2, 25],
                '26': [2, 25],
                '28': [2, 25],
                '31': [2, 25]
            },
            '26': {
                '7': [2, 28],
                '8': [2, 28],
                '9': [2, 28],
                '10': [2, 28],
                '11': [2, 28],
                '12': [2, 28],
                '13': [2, 28],
                '14': [2, 28],
                '15': [2, 28],
                '16': [2, 28],
                '17': [2, 28],
                '18': [1, undefined, 56],
                '19': [1, undefined, 57],
                '23': [2, 28],
                '24': [2, 28],
                '25': [2, 28],
                '26': [2, 28],
                '28': [2, 28],
                '31': [2, 28]
            },
            '27': {
                '7': [2, 33],
                '8': [2, 33],
                '9': [2, 33],
                '10': [2, 33],
                '11': [2, 33],
                '12': [2, 33],
                '13': [2, 33],
                '14': [2, 33],
                '15': [2, 33],
                '16': [2, 33],
                '17': [2, 33],
                '18': [2, 33],
                '19': [2, 33],
                '20': [1, undefined, 58],
                '21': [1, undefined, 59],
                '22': [1, undefined, 60],
                '23': [2, 33],
                '24': [2, 33],
                '25': [2, 33],
                '26': [2, 33],
                '28': [2, 33],
                '31': [2, 33]
            },
            '28': {
                '7': [2, 36],
                '8': [2, 36],
                '9': [2, 36],
                '10': [2, 36],
                '11': [2, 36],
                '12': [2, 36],
                '13': [2, 36],
                '14': [2, 36],
                '15': [2, 36],
                '16': [2, 36],
                '17': [2, 36],
                '18': [2, 36],
                '19': [2, 36],
                '20': [2, 36],
                '21': [2, 36],
                '22': [2, 36],
                '23': [2, 36],
                '24': [2, 36],
                '25': [2, 36],
                '26': [2, 36],
                '28': [2, 36],
                '31': [2, 36]
            },
            '29': {
                '7': [2, 41],
                '8': [2, 41],
                '9': [2, 41],
                '10': [2, 41],
                '11': [2, 41],
                '12': [2, 41],
                '13': [2, 41],
                '14': [2, 41],
                '15': [2, 41],
                '16': [2, 41],
                '17': [2, 41],
                '18': [2, 41],
                '19': [2, 41],
                '20': [2, 41],
                '21': [2, 41],
                '22': [2, 41],
                '23': [2, 41],
                '24': [2, 41],
                '25': [2, 41],
                '26': [2, 41],
                '28': [2, 41],
                '31': [2, 41]
            },
            '30': {
                '2': [1, undefined, 1],
                '3': [1, undefined, 2],
                '6': [1, undefined, 3]
            },
            '31': {
                '1': [2, 4],
                '2': [2, 4],
                '3': [2, 4],
                '4': [2, 4],
                '5': [2, 4],
                '6': [2, 4]
            },
            '32': {
                '4': [1, undefined, 62]
            },
            '33': {
                '2': [2, 10],
                '3': [2, 10],
                '6': [2, 10]
            },
            '34': {
                '7': [2, 55],
                '8': [2, 55],
                '10': [2, 55],
                '11': [2, 55],
                '12': [2, 55],
                '13': [2, 55],
                '14': [2, 55],
                '15': [2, 55],
                '16': [2, 55],
                '17': [2, 55],
                '18': [2, 55],
                '19': [2, 55],
                '20': [2, 55],
                '21': [2, 55],
                '22': [2, 55],
                '23': [2, 55],
                '24': [2, 55],
                '25': [2, 55],
                '26': [2, 55],
                '27': [1, undefined, 64],
                '28': [2, 55],
                '29': [2, 55],
                '30': [2, 55]
            },
            '35': {
                '7': [2, 45],
                '8': [2, 45],
                '9': [2, 45],
                '10': [2, 45],
                '11': [2, 45],
                '12': [2, 45],
                '13': [2, 45],
                '14': [2, 45],
                '15': [2, 45],
                '16': [2, 45],
                '17': [2, 45],
                '18': [2, 45],
                '19': [2, 45],
                '20': [2, 45],
                '21': [2, 45],
                '22': [2, 45],
                '23': [2, 45],
                '24': [2, 45],
                '25': [2, 45],
                '26': [2, 45],
                '28': [2, 45],
                '31': [2, 45]
            },
            '36': {
                '7': [2, 19],
                '8': [2, 19],
                '23': [2, 19],
                '24': [2, 19],
                '25': [2, 19],
                '26': [2, 19],
                '28': [2, 19]
            },
            '37': {
                '7': [2, 15],
                '8': [1, undefined, 14],
                '23': [1, undefined, 15],
                '24': [1, undefined, 16],
                '25': [1, undefined, 17],
                '26': [1, undefined, 18],
                '28': [1, undefined, 34]
            },
            '38': {
                '7': [2, 16]
            },
            '39': {
                '7': [2, 18],
                '8': [2, 18],
                '23': [2, 18],
                '24': [2, 18],
                '25': [2, 18],
                '26': [2, 18],
                '28': [2, 18]
            },
            '40': {
                '7': [2, 47],
                '28': [1, undefined, 67]
            },
            '41': {
                '7': [2, 49],
                '28': [2, 49]
            },
            '42': {
                '26': [1, undefined, 69],
                '28': [1, undefined, 70]
            },
            '43': {
                '8': [1, undefined, 14],
                '23': [1, undefined, 15],
                '24': [1, undefined, 16],
                '25': [1, undefined, 17],
                '26': [1, undefined, 18],
                '28': [1, undefined, 9]
            },
            '44': {
                '9': [1, undefined, 72]
            },
            '45': {
                '7': [2, 40],
                '8': [2, 40],
                '9': [2, 40],
                '10': [2, 40],
                '11': [2, 40],
                '12': [2, 40],
                '13': [2, 40],
                '14': [2, 40],
                '15': [2, 40],
                '16': [2, 40],
                '17': [2, 40],
                '18': [2, 40],
                '19': [2, 40],
                '20': [2, 40],
                '21': [2, 40],
                '22': [2, 40],
                '23': [2, 40],
                '24': [2, 40],
                '25': [2, 40],
                '26': [2, 40],
                '28': [2, 40],
                '31': [2, 40]
            },
            '46': {
                '1': [2, 12],
                '2': [2, 12],
                '3': [2, 12],
                '4': [2, 12],
                '5': [2, 12],
                '6': [2, 12]
            },
            '47': {
                '1': [2, 13],
                '2': [2, 13],
                '3': [2, 13],
                '4': [2, 13],
                '5': [2, 13],
                '6': [2, 13]
            },
            '48': {
                '8': [1, undefined, 14],
                '23': [1, undefined, 15],
                '24': [1, undefined, 16],
                '25': [1, undefined, 17],
                '26': [1, undefined, 18],
                '28': [1, undefined, 9]
            },
            '49': {
                '8': [1, undefined, 14],
                '23': [1, undefined, 15],
                '24': [1, undefined, 16],
                '25': [1, undefined, 17],
                '26': [1, undefined, 18],
                '28': [1, undefined, 9]
            },
            '50': {
                '8': [1, undefined, 14],
                '23': [1, undefined, 15],
                '24': [1, undefined, 16],
                '25': [1, undefined, 17],
                '26': [1, undefined, 18],
                '28': [1, undefined, 9]
            },
            '51': {
                '8': [1, undefined, 14],
                '23': [1, undefined, 15],
                '24': [1, undefined, 16],
                '25': [1, undefined, 17],
                '26': [1, undefined, 18],
                '28': [1, undefined, 9]
            },
            '52': {
                '8': [1, undefined, 14],
                '23': [1, undefined, 15],
                '24': [1, undefined, 16],
                '25': [1, undefined, 17],
                '26': [1, undefined, 18],
                '28': [1, undefined, 9]
            },
            '53': {
                '8': [1, undefined, 14],
                '23': [1, undefined, 15],
                '24': [1, undefined, 16],
                '25': [1, undefined, 17],
                '26': [1, undefined, 18],
                '28': [1, undefined, 9]
            },
            '54': {
                '8': [1, undefined, 14],
                '23': [1, undefined, 15],
                '24': [1, undefined, 16],
                '25': [1, undefined, 17],
                '26': [1, undefined, 18],
                '28': [1, undefined, 9]
            },
            '55': {
                '8': [1, undefined, 14],
                '23': [1, undefined, 15],
                '24': [1, undefined, 16],
                '25': [1, undefined, 17],
                '26': [1, undefined, 18],
                '28': [1, undefined, 9]
            },
            '56': {
                '8': [1, undefined, 14],
                '23': [1, undefined, 15],
                '24': [1, undefined, 16],
                '25': [1, undefined, 17],
                '26': [1, undefined, 18],
                '28': [1, undefined, 9]
            },
            '57': {
                '8': [1, undefined, 14],
                '23': [1, undefined, 15],
                '24': [1, undefined, 16],
                '25': [1, undefined, 17],
                '26': [1, undefined, 18],
                '28': [1, undefined, 9]
            },
            '58': {
                '8': [1, undefined, 14],
                '23': [1, undefined, 15],
                '24': [1, undefined, 16],
                '25': [1, undefined, 17],
                '26': [1, undefined, 18],
                '28': [1, undefined, 9]
            },
            '59': {
                '8': [1, undefined, 14],
                '23': [1, undefined, 15],
                '24': [1, undefined, 16],
                '25': [1, undefined, 17],
                '26': [1, undefined, 18],
                '28': [1, undefined, 9]
            },
            '60': {
                '8': [1, undefined, 14],
                '23': [1, undefined, 15],
                '24': [1, undefined, 16],
                '25': [1, undefined, 17],
                '26': [1, undefined, 18],
                '28': [1, undefined, 9]
            },
            '61': {
                '1': [2, 1],
                '2': [1, undefined, 1],
                '3': [1, undefined, 2],
                '4': [2, 1],
                '6': [1, undefined, 3]
            },
            '62': {
                '28': [1, undefined, 9]
            },
            '63': {
                '1': [2, 5],
                '2': [2, 5],
                '3': [2, 5],
                '4': [2, 5],
                '5': [2, 5],
                '6': [2, 5]
            },
            '64': {
                '8': [1, undefined, 14],
                '23': [1, undefined, 15],
                '24': [1, undefined, 16],
                '25': [1, undefined, 17],
                '26': [1, undefined, 18],
                '28': [1, undefined, 9]
            },
            '65': {
                '7': [2, 14]
            },
            '66': {
                '7': [2, 17],
                '8': [2, 17],
                '23': [2, 17],
                '24': [2, 17],
                '25': [2, 17],
                '26': [2, 17],
                '28': [2, 17]
            },
            '67': {
                '27': [1, undefined, 64]
            },
            '68': {
                '7': [2, 48],
                '28': [2, 48]
            },
            '69': {
                '7': [2, 54],
                '8': [2, 54],
                '9': [2, 54],
                '10': [2, 54],
                '11': [2, 54],
                '12': [2, 54],
                '13': [2, 54],
                '14': [2, 54],
                '15': [2, 54],
                '16': [2, 54],
                '17': [2, 54],
                '18': [2, 54],
                '19': [2, 54],
                '20': [2, 54],
                '21': [2, 54],
                '22': [2, 54],
                '23': [2, 54],
                '24': [2, 54],
                '25': [2, 54],
                '26': [2, 54],
                '28': [2, 54],
                '29': [2, 54],
                '30': [2, 54],
                '31': [2, 54]
            },
            '70': {
                '7': [2, 52],
                '8': [2, 52],
                '9': [2, 52],
                '10': [2, 52],
                '11': [2, 52],
                '12': [2, 52],
                '13': [2, 52],
                '14': [2, 52],
                '15': [2, 52],
                '16': [2, 52],
                '17': [2, 52],
                '18': [2, 52],
                '19': [2, 52],
                '20': [2, 52],
                '21': [2, 52],
                '22': [2, 52],
                '23': [2, 52],
                '24': [2, 52],
                '25': [2, 52],
                '26': [2, 52],
                '28': [2, 52],
                '29': [2, 52],
                '30': [2, 52],
                '31': [2, 52]
            },
            '71': {
                '31': [1, undefined, 88]
            },
            '72': {
                '7': [2, 46],
                '8': [2, 46],
                '9': [2, 46],
                '10': [2, 46],
                '11': [2, 46],
                '12': [2, 46],
                '13': [2, 46],
                '14': [2, 46],
                '15': [2, 46],
                '16': [2, 46],
                '17': [2, 46],
                '18': [2, 46],
                '19': [2, 46],
                '20': [2, 46],
                '21': [2, 46],
                '22': [2, 46],
                '23': [2, 46],
                '24': [2, 46],
                '25': [2, 46],
                '26': [2, 46],
                '28': [2, 46],
                '31': [2, 46]
            },
            '73': {
                '7': [2, 22],
                '8': [2, 22],
                '9': [2, 22],
                '10': [2, 22],
                '11': [1, undefined, 49],
                '23': [2, 22],
                '24': [2, 22],
                '25': [2, 22],
                '26': [2, 22],
                '28': [2, 22],
                '31': [2, 22]
            },
            '74': {
                '7': [2, 24],
                '8': [2, 24],
                '9': [2, 24],
                '10': [2, 24],
                '11': [2, 24],
                '12': [1, undefined, 50],
                '13': [1, undefined, 51],
                '23': [2, 24],
                '24': [2, 24],
                '25': [2, 24],
                '26': [2, 24],
                '28': [2, 24],
                '31': [2, 24]
            },
            '75': {
                '7': [2, 26],
                '8': [2, 26],
                '9': [2, 26],
                '10': [2, 26],
                '11': [2, 26],
                '12': [2, 26],
                '13': [2, 26],
                '14': [1, undefined, 52],
                '15': [1, undefined, 53],
                '16': [1, undefined, 54],
                '17': [1, undefined, 55],
                '23': [2, 26],
                '24': [2, 26],
                '25': [2, 26],
                '26': [2, 26],
                '28': [2, 26],
                '31': [2, 26]
            },
            '76': {
                '7': [2, 27],
                '8': [2, 27],
                '9': [2, 27],
                '10': [2, 27],
                '11': [2, 27],
                '12': [2, 27],
                '13': [2, 27],
                '14': [1, undefined, 52],
                '15': [1, undefined, 53],
                '16': [1, undefined, 54],
                '17': [1, undefined, 55],
                '23': [2, 27],
                '24': [2, 27],
                '25': [2, 27],
                '26': [2, 27],
                '28': [2, 27],
                '31': [2, 27]
            },
            '77': {
                '7': [2, 30],
                '8': [2, 30],
                '9': [2, 30],
                '10': [2, 30],
                '11': [2, 30],
                '12': [2, 30],
                '13': [2, 30],
                '14': [2, 30],
                '15': [2, 30],
                '16': [2, 30],
                '17': [2, 30],
                '18': [1, undefined, 56],
                '19': [1, undefined, 57],
                '23': [2, 30],
                '24': [2, 30],
                '25': [2, 30],
                '26': [2, 30],
                '28': [2, 30],
                '31': [2, 30]
            },
            '78': {
                '7': [2, 32],
                '8': [2, 32],
                '9': [2, 32],
                '10': [2, 32],
                '11': [2, 32],
                '12': [2, 32],
                '13': [2, 32],
                '14': [2, 32],
                '15': [2, 32],
                '16': [2, 32],
                '17': [2, 32],
                '18': [1, undefined, 56],
                '19': [1, undefined, 57],
                '23': [2, 32],
                '24': [2, 32],
                '25': [2, 32],
                '26': [2, 32],
                '28': [2, 32],
                '31': [2, 32]
            },
            '79': {
                '7': [2, 29],
                '8': [2, 29],
                '9': [2, 29],
                '10': [2, 29],
                '11': [2, 29],
                '12': [2, 29],
                '13': [2, 29],
                '14': [2, 29],
                '15': [2, 29],
                '16': [2, 29],
                '17': [2, 29],
                '18': [1, undefined, 56],
                '19': [1, undefined, 57],
                '23': [2, 29],
                '24': [2, 29],
                '25': [2, 29],
                '26': [2, 29],
                '28': [2, 29],
                '31': [2, 29]
            },
            '80': {
                '7': [2, 31],
                '8': [2, 31],
                '9': [2, 31],
                '10': [2, 31],
                '11': [2, 31],
                '12': [2, 31],
                '13': [2, 31],
                '14': [2, 31],
                '15': [2, 31],
                '16': [2, 31],
                '17': [2, 31],
                '18': [1, undefined, 56],
                '19': [1, undefined, 57],
                '23': [2, 31],
                '24': [2, 31],
                '25': [2, 31],
                '26': [2, 31],
                '28': [2, 31],
                '31': [2, 31]
            },
            '81': {
                '7': [2, 34],
                '8': [2, 34],
                '9': [2, 34],
                '10': [2, 34],
                '11': [2, 34],
                '12': [2, 34],
                '13': [2, 34],
                '14': [2, 34],
                '15': [2, 34],
                '16': [2, 34],
                '17': [2, 34],
                '18': [2, 34],
                '19': [2, 34],
                '20': [1, undefined, 58],
                '21': [1, undefined, 59],
                '22': [1, undefined, 60],
                '23': [2, 34],
                '24': [2, 34],
                '25': [2, 34],
                '26': [2, 34],
                '28': [2, 34],
                '31': [2, 34]
            },
            '82': {
                '7': [2, 35],
                '8': [2, 35],
                '9': [2, 35],
                '10': [2, 35],
                '11': [2, 35],
                '12': [2, 35],
                '13': [2, 35],
                '14': [2, 35],
                '15': [2, 35],
                '16': [2, 35],
                '17': [2, 35],
                '18': [2, 35],
                '19': [2, 35],
                '20': [1, undefined, 58],
                '21': [1, undefined, 59],
                '22': [1, undefined, 60],
                '23': [2, 35],
                '24': [2, 35],
                '25': [2, 35],
                '26': [2, 35],
                '28': [2, 35],
                '31': [2, 35]
            },
            '83': {
                '7': [2, 37],
                '8': [2, 37],
                '9': [2, 37],
                '10': [2, 37],
                '11': [2, 37],
                '12': [2, 37],
                '13': [2, 37],
                '14': [2, 37],
                '15': [2, 37],
                '16': [2, 37],
                '17': [2, 37],
                '18': [2, 37],
                '19': [2, 37],
                '20': [2, 37],
                '21': [2, 37],
                '22': [2, 37],
                '23': [2, 37],
                '24': [2, 37],
                '25': [2, 37],
                '26': [2, 37],
                '28': [2, 37],
                '31': [2, 37]
            },
            '84': {
                '7': [2, 38],
                '8': [2, 38],
                '9': [2, 38],
                '10': [2, 38],
                '11': [2, 38],
                '12': [2, 38],
                '13': [2, 38],
                '14': [2, 38],
                '15': [2, 38],
                '16': [2, 38],
                '17': [2, 38],
                '18': [2, 38],
                '19': [2, 38],
                '20': [2, 38],
                '21': [2, 38],
                '22': [2, 38],
                '23': [2, 38],
                '24': [2, 38],
                '25': [2, 38],
                '26': [2, 38],
                '28': [2, 38],
                '31': [2, 38]
            },
            '85': {
                '7': [2, 39],
                '8': [2, 39],
                '9': [2, 39],
                '10': [2, 39],
                '11': [2, 39],
                '12': [2, 39],
                '13': [2, 39],
                '14': [2, 39],
                '15': [2, 39],
                '16': [2, 39],
                '17': [2, 39],
                '18': [2, 39],
                '19': [2, 39],
                '20': [2, 39],
                '21': [2, 39],
                '22': [2, 39],
                '23': [2, 39],
                '24': [2, 39],
                '25': [2, 39],
                '26': [2, 39],
                '28': [2, 39],
                '31': [2, 39]
            },
            '86': {
                '7': [1, undefined, 89]
            },
            '87': {
                '7': [2, 50],
                '28': [2, 50]
            },
            '88': {
                '7': [2, 53],
                '8': [2, 53],
                '9': [2, 53],
                '10': [2, 53],
                '11': [2, 53],
                '12': [2, 53],
                '13': [2, 53],
                '14': [2, 53],
                '15': [2, 53],
                '16': [2, 53],
                '17': [2, 53],
                '18': [2, 53],
                '19': [2, 53],
                '20': [2, 53],
                '21': [2, 53],
                '22': [2, 53],
                '23': [2, 53],
                '24': [2, 53],
                '25': [2, 53],
                '26': [2, 53],
                '28': [2, 53],
                '29': [2, 53],
                '30': [2, 53],
                '31': [2, 53]
            },
            '89': {
                '1': [2, 11],
                '2': [2, 11],
                '3': [2, 11],
                '4': [2, 11],
                '5': [2, 11],
                '6': [2, 11]
            }
        }
    };
    parser.parse = function parse(input) {

        var self = this,
            lexer = self.lexer,
            state,
            symbol,
            action,
            table = self.table,
            gotos = table.gotos,
            tableAction = table.action,
            productions = self.productions,
            valueStack = [null],
            stack = [0];

        lexer.resetInput(input);

        while (1) {
            // retrieve state number from top of stack
            state = stack[stack.length - 1];

            if (!symbol) {
                symbol = lexer.lex();
            }

            if (!symbol) {
                S.log("it is not a valid input: " + input, "error");
                return false;
            }

            // read action for current state and first input
            action = tableAction[state] && tableAction[state][symbol];

            if (!action) {
                var expected = [],
                    error;
                if (tableAction[state]) {
                    S.each(tableAction[state], function (_, symbol) {
                        expected.push(self.lexer.mapReverseSymbol(symbol));
                    });
                }
                error = "Syntax error at line " + lexer.lineNumber + ":\n" + lexer.showDebugInfo() + "\n" + "expect " + expected.join(", ");
                S.error(error);
                return false;
            }

            switch (action[GrammarConst.TYPE_INDEX]) {

                case GrammarConst.SHIFT_TYPE:

                    stack.push(symbol);

                    valueStack.push(lexer.text);

                    // push state
                    stack.push(action[GrammarConst.TO_INDEX]);

                    // allow to read more
                    symbol = null;

                    break;

                case GrammarConst.REDUCE_TYPE:

                    var production = productions[action[GrammarConst.PRODUCTION_INDEX]],
                        reducedSymbol = production.symbol || production[0],
                        reducedAction = production.action || production[2],
                        reducedRhs = production.rhs || production[1],
                        len = reducedRhs.length,
                        i = 0,
                        ret = undefined,
                        $$ = valueStack[valueStack.length - len]; // default to $$ = $1

                    self.$$ = $$;

                    for (; i < len; i++) {
                        self["$" + (len - i)] = valueStack[valueStack.length - 1 - i];
                    }

                    if (reducedAction) {
                        ret = reducedAction.call(self);
                    }

                    if (ret !== undefined) {
                        $$ = ret;
                    } else {
                        $$ = self.$$;
                    }

                    if (len) {
                        stack = stack.slice(0, -1 * len * 2);
                        valueStack = valueStack.slice(0, -1 * len);
                    }

                    stack.push(reducedSymbol);

                    valueStack.push($$);

                    var newState = gotos[stack[stack.length - 2]][stack[stack.length - 1]];

                    stack.push(newState);

                    break;

                case GrammarConst.ACCEPT_TYPE:

                    return $$;
            }

        }

        return undefined;

    };
    return parser;
});


/**
 * Ast node class for xtemplate
 * @author yiminghe@gmail.com
 * @ignore
 */
KISSY.add('kg/bidi/2.0.0/xtemplate/ast',function (S) {

    var ast = {};

    /**
     * @ignore
     * @param lineNumber
     * @param statements
     * @param [inverse]
     * @constructor
     */
    ast.ProgramNode = function (lineNumber, statements, inverse) {
        var self = this;
        self.lineNumber = lineNumber;
        self.statements = statements;
        self.inverse = inverse;
    };

    ast.ProgramNode.prototype.type = 'program';

    ast.BlockNode = function (lineNumber, tpl, program, close) {
        var closeParts = close['parts'], self = this, e;
        // no close tag
        if (!S.equals(tpl.path['parts'], closeParts)) {
            e = ("Syntax error at line " +
                lineNumber +
                ":\n" + "expect {{/" +
                tpl.path['parts'] +
                "}} not {{/" +
                closeParts + "}}");
            S.error(e);
        }
        self.lineNumber = lineNumber;
        self.tpl = tpl;
        self.program = program;
    };

    ast.BlockNode.prototype.type = 'block';

    /**
     * @ignore
     * @param lineNumber
     * @param path
     * @param [params]
     * @param [hash]
     * @constructor
     */
    ast.TplNode = function (lineNumber, path, params, hash) {
        var self = this;
        self.lineNumber = lineNumber;
        self.path = path;
        self.params = params;
        self.hash = hash;
        self.escaped = true;
        // inside {{^}}
        // default: inside {{#}}
        self.isInverted = false;
    };

    ast.TplNode.prototype.type = 'tpl';


    ast.TplExpressionNode = function (lineNumber, expression) {
        var self = this;
        self.lineNumber = lineNumber;
        self.expression = expression;
        self.escaped = true;
    };

    ast.TplExpressionNode.prototype.type = 'tplExpression';

    ast.ContentNode = function (lineNumber, value) {
        var self = this;
        self.lineNumber = lineNumber;
        self.value = value;
    };

    ast.ContentNode.prototype.type = 'content';

    ast.UnaryExpression = function (v) {
        this.value = v;
    };

    ast.UnaryExpression.prototype.type = 'unaryExpression';

    ast.MultiplicativeExpression = function (op1, opType, op2) {
        var self = this;
        self.op1 = op1;
        self.opType = opType;
        self.op2 = op2;
    };

    ast.MultiplicativeExpression.prototype.type = 'multiplicativeExpression';

    ast.AdditiveExpression = function (op1, opType, op2) {
        var self = this;
        self.op1 = op1;
        self.opType = opType;
        self.op2 = op2;
    };

    ast.AdditiveExpression.prototype.type = 'additiveExpression';

    ast.RelationalExpression = function (op1, opType, op2) {
        var self = this;
        self.op1 = op1;
        self.opType = opType;
        self.op2 = op2;
    };

    ast.RelationalExpression.prototype.type = 'relationalExpression';

    ast.EqualityExpression = function (op1, opType, op2) {
        var self = this;
        self.op1 = op1;
        self.opType = opType;
        self.op2 = op2;
    };

    ast.EqualityExpression.prototype.type = 'equalityExpression';

    ast.ConditionalAndExpression = function (op1, op2) {
        var self = this;
        self.op1 = op1;
        self.op2 = op2;
    };

    ast.ConditionalAndExpression.prototype.type = 'conditionalAndExpression';

    ast.ConditionalOrExpression = function (op1, op2) {
        var self = this;
        self.op1 = op1;
        self.op2 = op2;
    };

    ast.ConditionalOrExpression.prototype.type = 'conditionalOrExpression';

    ast.StringNode = function (lineNumber, value) {
        var self = this;
        self.lineNumber = lineNumber;
        self.value = value;
    };

    ast.StringNode.prototype.type = 'string';

    ast.NumberNode = function (lineNumber, value) {
        var self = this;
        self.lineNumber = lineNumber;
        self.value = value;
    };

    ast.NumberNode.prototype.type = 'number';

    ast.BooleanNode = function (lineNumber, value) {
        var self = this;
        self.lineNumber = lineNumber;
        self.value = value;
    };

    ast.BooleanNode.prototype.type = 'boolean';

    ast.HashNode = function (lineNumber, raw) {
        var self = this, value = {};
        self.lineNumber = lineNumber;
        S.each(raw, function (r) {
            value[r[0]] = r[1];
        });
        self.value = value;
    };

    ast.HashNode.prototype.type = 'hash';

    ast.IdNode = function (lineNumber, raw) {
        var self = this, parts = [], depth = 0;
        self.lineNumber = lineNumber;
        S.each(raw, function (p) {
            if (p == "..") {
                depth++;
            } else {
                parts.push(p);
            }
        });
        self.parts = parts;
        self.string = parts.join('.');
        self.depth = depth;
    };

    ast.IdNode.prototype.type = 'id';

    return ast;
});

/*
Copyright 2013, KISSY v1.40
MIT Licensed
build time: Nov 12 12:32
*/
/**
 * translate ast to js function code
 * @author yiminghe@gmail.com
 * @ignore
 */
KISSY.add('kg/bidi/2.0.0/xtemplate/compiler',function (S, parser, ast, XTemplateRuntime, undefined) {
    parser.yy = ast;

    var doubleReg = /\\*"/g,
        singleReg = /\\*'/g,
        arrayPush = [].push,
        variableId = 0,
        xtemplateId = 0;

    function guid(str) {
        return str + (variableId++);
    }

    function escapeString(str, isCode) {
        if (isCode) {
            str = escapeSingleQuoteInCodeString(str, false);
        } else {
            str = str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        }
        str = str.replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n').replace(/\t/g, '\\t');
        return str;
    }

    function escapeSingleQuoteInCodeString(str, isDouble) {
        return str.replace(isDouble ? doubleReg : singleReg, function (m) {
            // \ 's number ，用户显式转过 "\'" , "\\\'" 就不处理了，否则手动对 ` 加 \ 转义
            if (m.length % 2) {
                m = '\\' + m;
            }
            return m;
        });
    }

    function pushToArray(to, from) {
        arrayPush.apply(to, from);
    }

    function lastOfArray(arr) {
        return arr[arr.length - 1];
    }

    var gen = {
        // ------------ helper generation function start
        genFunction: function (statements, global, includes) {
            var source = [];
            if (!global) {
                source.push('function(scopes) {');
            }
            source.push('var buffer = ""' + (global ? ',' : ';'));
            if (global) {
                source.push('config = this.config,' +
                    // current xtemplate engine
                    'engine = this, ' +
                    'utils = config.utils;');

                var natives = '',
                    c,
                    utils = XTemplateRuntime.utils;

                for (c in utils) {
                    natives += c + 'Util = utils["' + c + '"],';
                }

                if (natives) {
                    source.push('var ' + natives.slice(0, natives.length - 1) + ';');
                }
            }
            if (statements) {
                for (var i = 0, len = statements.length; i < len; i++) {
                    pushToArray(source, this[statements[i].type](statements[i], includes));
                }
            }
            source.push('return buffer;');
            if (!global) {
                source.push('}');
                return source;
            } else {
                return {
                    params: ['scopes', 'S', 'undefined'],
                    source: source,
                    includes: includes
                };
            }
        },

        genId: function (idNode, tplNode, preserveUndefined, includes) {
            var source = [],
                depth = idNode.depth,
                idParts = idNode.parts,
                idName = guid('id'),
                self = this;

            // {{#each variable}} {{variable}}
            // {{command}}
            if (depth == 0) {
                var configNameCode = tplNode && self.genConfig(tplNode);
                var configName;
                if (configNameCode) {
                    configName = configNameCode[0];
                    pushToArray(source, configNameCode[1]);
                }
            }

            // variable {{variable.subVariable}}
            var idString = self.getIdStringFromIdParts(source, idParts);

            // collect includes modules
            if (includes && idString == 'include') {
                includes.push(tplNode.params[0].value);
            }

            source.push('var ' + idName +
                ' = getPropertyOrRunCommandUtil(engine,scopes,' +
                (configName || '{}') + ',"' +
                idString +
                '",' + depth + ',' + idNode.lineNumber +
                ',' + (tplNode && tplNode.escaped) +
                ',' + preserveUndefined + ');');

            return [idName, source];
        },

        genOpExpression: function (e, type) {
            var source = [],
                name1,
                name2,
                code1 = this[e.op1.type](e.op1),
                code2 = this[e.op2.type](e.op2);

            name1 = code1[0];
            name2 = code2[0];

            if (name1 && name2) {
                pushToArray(source, code1[1]);
                pushToArray(source, code2[1]);
                source.push(name1 + type + name2);
                return ['', source];
            }

            if (!name1 && !name2) {
                pushToArray(source, code1[1].slice(0, -1));
                pushToArray(source, code2[1].slice(0, -1));
                source.push('(' +
                    lastOfArray(code1[1]) +
                    ')' +
                    type +
                    '(' + lastOfArray(code2[1]) + ')');
                return ['', source];
            }

            if (name1 && !name2) {
                pushToArray(source, code1[1]);
                pushToArray(source, code2[1].slice(0, -1));
                source.push(name1 + type +
                    '(' +
                    lastOfArray(code2[1]) +
                    ')');
                return ['', source];
            }

            if (!name1 && name2) {
                pushToArray(source, code1[1].slice(0, -1));
                pushToArray(source, code2[1]);
                source.push('(' +
                    lastOfArray(code1[1]) +
                    ')' +
                    type + name2);
                return ['', source];
            }

            return undefined;
        },

        genConfig: function (tplNode) {
            var source = [],
                configName,
                params,
                hash,
                self = this;

            if (tplNode) {
                params = tplNode.params;
                hash = tplNode.hash;

                if (params || hash) {
                    configName = guid('config');
                    source.push('var ' + configName + ' = {};');
                }

                if (params) {
                    var paramsName = guid('params');
                    source.push('var ' + paramsName + ' = [];');
                    S.each(params, function (param) {
                        var nextIdNameCode = self[param.type](param);
                        if (nextIdNameCode[0]) {
                            pushToArray(source, nextIdNameCode[1]);
                            source.push(paramsName + '.push(' + nextIdNameCode[0] + ');')
                        } else {
                            pushToArray(source, nextIdNameCode[1].slice(0, -1));
                            source.push(paramsName + '.push(' + lastOfArray(nextIdNameCode[1]) + ');')
                        }
                    });
                    source.push(configName + '.params=' + paramsName + ';');
                }

                if (hash) {
                    var hashName = guid('hash');
                    source.push('var ' + hashName + ' = {};');
                    S.each(hash.value, function (v, key) {
                        var nextIdNameCode = self[v.type](v);
                        if (nextIdNameCode[0]) {
                            pushToArray(source, nextIdNameCode[1]);
                            source.push(hashName + '["' + key + '"] = ' + nextIdNameCode[0] + ';')
                        } else {
                            pushToArray(source, nextIdNameCode[1].slice(0, -1));
                            source.push(hashName + '["' + key + '"] = ' + lastOfArray(nextIdNameCode[1]) + ';')
                        }
                    });
                    source.push(configName + '.hash=' + hashName + ';');
                }
            }

            return [configName, source];
        },
        // ------------ helper generation function end

        conditionalOrExpression: function (e) {
            return this.genOpExpression(e, '||');
        },

        conditionalAndExpression: function (e) {
            return this.genOpExpression(e, '&&');
        },

        relationalExpression: function (e) {
            return this.genOpExpression(e, e.opType);
        },

        equalityExpression: function (e) {
            return this.genOpExpression(e, e.opType);
        },

        additiveExpression: function (e) {
            return this.genOpExpression(e, e.opType);
        },

        multiplicativeExpression: function (e) {
            return this.genOpExpression(e, e.opType);
        },

        unaryExpression: function (e) {
            var source = [],
                name,
                code = this[e.value.type](e.value);
            arrayPush.apply(source, code[1]);
            if (name = code[0]) {
                source.push(name + '=!' + name + ';');
            } else {
                source[source.length - 1] = '!' + lastOfArray(source);
            }
            return [name, source];
        },

        'string': function (e) {
            // same as contentNode.value
            return ['', ["'" + escapeString(e.value, true) + "'"]];
        },

        'number': function (e) {
            return ['', [e.value]];
        },

        'boolean': function (e) {
            return ['', [e.value]];
        },

        'id': function (e, topLevel) {
            // topLevel: {{n}}
            return this.genId(e, undefined, !topLevel);
        },

        'block': function (block) {
            var programNode = block.program,
                source = [],
                self = this,
                tplNode = block.tpl,
                configNameCode = self.genConfig(tplNode),
                configName = configNameCode[0],
                tplPath = tplNode.path,
                pathString = tplPath.string,
                inverseFn;

            pushToArray(source, configNameCode[1]);

            if (!configName) {
                configName = S.guid('config');
                source.push('var ' + configName + ' = {};');
            }

            source.push(configName + '.fn=' +
                self.genFunction(programNode.statements).join('\n') + ';');

            if (programNode.inverse) {
                inverseFn = self.genFunction(programNode.inverse).join('\n');
                source.push(configName + '.inverse=' + inverseFn + ';');
            }

            // support {{^
            // exchange fn with inverse
            if (tplNode.isInverted) {
                var tmp = guid('inverse');
                source.push('var ' + tmp + '=' + configName + '.fn;');
                source.push(configName + '.fn = ' + configName + '.inverse;');
                source.push(configName + '.inverse = ' + tmp + ';');
            }

            if (!tplNode.hash && !tplNode.params) {
                var parts = tplPath.parts;
                for (var i = 0; i < parts.length; i++) {
                    // {{x[d]}}
                    if (typeof parts[i] != 'string') {
                        pathString = self.getIdStringFromIdParts(source, parts);
                        break;
                    }
                }
            }

            source.push('buffer += runBlockCommandUtil(engine, scopes, ' +
                configName + ', ' +
                '"' + pathString + '", ' +
                tplPath.lineNumber + ');');
            return source;
        },

        'content': function (contentNode) {
            return ['buffer += \'' + escapeString(contentNode.value, false) + '\';'];
        },

        'tpl': function (tplNode, includes) {
            var source = [],
                genIdCode = this.genId(tplNode.path, tplNode, undefined, includes);
            pushToArray(source, genIdCode[1]);
            source.push('buffer += ' + genIdCode[0] + ';');
            return source;
        },

        'tplExpression': function (e) {
            var source = [],
                escaped = e.escaped,
                expressionOrVariable;
            var code = this[e.expression.type](e.expression, 1);
            if (code[0]) {
                pushToArray(source, code[1]);
                expressionOrVariable = code[0];
            } else {
                pushToArray(source, code[1].slice(0, -1));
                expressionOrVariable = lastOfArray(code[1]);
            }
            source.push('buffer += getExpressionUtil(' + expressionOrVariable + ',' + escaped + ');');
            return source;
        },

        // consider x[d]
        'getIdStringFromIdParts': function (source, idParts) {
            var idString = '',
                self = this,
                i,
                idPart,
                idPartType,
                nextIdNameCode,
                first = true;
            for (i = 0; i < idParts.length; i++) {
                idPart = idParts[i];
                idPartType = idPart.type;
                if (!first) {
                    idString += '.';
                }
                if (idPartType) {
                    nextIdNameCode = self[idPartType](idPart);
                    if (nextIdNameCode[0]) {
                        pushToArray(source, nextIdNameCode[1]);
                        idString += '"+' + nextIdNameCode[0] + '+"';
                        first = true
                    }
                } else {
                    // number or string
                    idString += idPart;
                    first = false;
                }
            }
            return idString;
        }
    };

    var compiler;

    /**
     * compiler for xtemplate
     * @class KISSY.XTemplate.compiler
     * @singleton
     */
    return compiler = {
        /**
         * get ast of template
         * @param {String} tpl
         * @return {Object}
         */
        parse: function (tpl) {
            return parser.parse(tpl);
        },
        /**
         * get template function string
         * @param {String} tpl
         * @return {String}
         */
        compileToStr: function (tpl) {
            var func = this.compile(tpl);
            return 'function(' + func.params.join(',') + '){\n' +
                func.source.join('\n') +
                '}';
        },
        compileToModule: function (tpl, includes) {
            var func = this.compile(tpl, includes);
            var requires = '';
            if (includes && includes.length) {
                requires += includes.join('","');
                requires = ', {requires:["' + requires + '"]}';
            }
            return '/** Compiled By kissy-xtemplate */\n' +
                'KISSY.add(function(){ return function(' + func.params.join(',') + '){\n' +
                func.source.join('\n') +
                '};}' + requires + ');';
        },
        /**
         * get template function json format
         * @param {String} tpl
         * @param {String[]} [includes] included modules
         * @return {Object}
         */
        compile: function (tpl, includes) {
            var root = this.parse(tpl);
            variableId = 0;
            return gen.genFunction(root.statements, true, includes);
        },
        /**
         * get template function
         * @param {String} tpl
         * @param {Object} config
         * @param {String} config.name template file name
         * @return {Function}
         */
        compileToFn: function (tpl, config) {
            var code = compiler.compile(tpl);
            config = config || {};
            var sourceURL = 'sourceURL=' + (config.name ?
                config.name :
                ('xtemplate' + (xtemplateId++))) +
                '.js';
            // eval is not ok for eval("(function(){})") ie
            return Function.apply(null, []
                .concat(code.params)
                .concat(code.source.join('\n') +
                    // old chrome
                    '\n//@ ' + sourceURL +
                    // modern browser
                    '\n//# ' + sourceURL));
        }
    };
}, {
    requires: ['./parser', './ast', './runtime']
});

/*
 todo:
 need oop, new Source().gen()
 */


/*
Copyright 2013, KISSY v1.40
MIT Licensed
build time: Sep 17 23:11
*/
/*
 Combined processedModules by KISSY Module Compiler: 

 xtemplate
*/

/**
 * @ignore
 * simple facade for runtime and compiler
 * @author yiminghe@gmail.com
 */
KISSY.add('kg/bidi/2.0.0/xtemplate',function (S, XTemplateRuntime, compiler) {
    var cache = XTemplate.cache = {};

    function compile(tpl, config) {
        var fn;

        if (config.cache && (fn = cache[tpl])) {
            return fn;
        }

        fn = compiler.compileToFn(tpl, config);

        if (config.cache) {
            cache[tpl] = fn;
        }

        return fn;
    }

    var defaultCfg = {
        /**
         * whether cache template string
         * @member KISSY.XTemplate
         * @cfg {Boolean} cache
         */
        cache: true
    };

    /**
     * xtemplate engine for KISSY.
     *
     *
     *      @example
     *      KISSY.use('xtemplate140',function(S, XTemplate){
     *          document.writeln(new XTemplate('{{title}}').render({title:2}));
     *      });
     *
     *
     * @class KISSY.XTemplate
     * @extends KISSY.XTemplate.Runtime
     */
    function XTemplate(tpl, config) {
        var self = this;
        config = S.merge(defaultCfg, config);

        if (typeof tpl == 'string') {
            tpl = compile(tpl, config);
        }

        XTemplate.superclass.constructor.call(self, tpl, config);
    }

    S.extend(XTemplate, XTemplateRuntime, {}, {
        compiler: compiler,

        RunTime: XTemplateRuntime,

        /**
         * add command to all template
         * @method
         * @static
         * @param {String} commandName
         * @param {Function} fn
         */
        addCommand: XTemplateRuntime.addCommand,

        /**
         * remove command from all template by name
         * @method
         * @static
         * @param {String} commandName
         */
        removeCommand: XTemplateRuntime.removeCommand
    });

    return XTemplate;

}, {
    requires: ['./xtemplate/runtime', './xtemplate/compiler']
});

/*
 It consists three modules:

 -   xtemplate - Both compiler and runtime functionality.
 -   xtemplate/compiler - Compiler string template to module functions.
 -   xtemplate/runtime -  Runtime for string template( with xtemplate/compiler loaded)
 or template functions.

 xtemplate/compiler depends on xtemplate/runtime,
 because compiler needs to know about runtime to generate corresponding codes.
 */

KISSY.add('kg/bidi/2.0.0/expression/parse',function(){

/* parser generated by jison 0.4.13 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parse = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"expressions":3,"math":4,"EOF":5,"var":6,"VAR":7,"DOT":8,"||":9,"&&":10,">":11,"<":12,"===":13,"==":14,">=":15,"<=":16,"!=":17,"!":18,"NUMBER":19,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",7:"VAR",8:"DOT",9:"||",10:"&&",11:">",12:"<",13:"===",14:"==",15:">=",16:"<=",17:"!=",18:"!",19:"NUMBER"},
productions_: [0,[3,2],[6,1],[6,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,2],[4,1],[4,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1: return $$[$0-1]; 
break;
case 2: this.$ = { name: $$[$0], path: [] } 
break;
case 3: this.$ = { name : $$[$0-2].name, path: $$[$0-2].path.concat($$[$0]) } 
break;
case 4: this.$ = { l: $$[$0-2], r: $$[$0], operator: $$[$0-1] }; 
break;
case 5: this.$ = { l: $$[$0-2], r: $$[$0], operator: $$[$0-1] }; 
break;
case 6: this.$ = { l: $$[$0-2], r: $$[$0], operator: $$[$0-1] }; 
break;
case 7: this.$ = { l: $$[$0-2], r: $$[$0], operator: $$[$0-1] }; 
break;
case 8: this.$ = { l: $$[$0-2], r: $$[$0], operator: $$[$0-1] }; 
break;
case 9: this.$ = { l: $$[$0-2], r: $$[$0], operator: $$[$0-1] }; 
break;
case 10: this.$ = { l: $$[$0-2], r: $$[$0], operator: $$[$0-1] }; 
break;
case 11: this.$ = { l: $$[$0-2], r: $$[$0], operator: $$[$0-1] }; 
break;
case 12: this.$ = { l: $$[$0-2], r: $$[$0], operator: $$[$0-1] }; 
break;
case 13: this.$ = { l: $$[$0], operator: 'not' }; 
break;
case 14: this.$ = $$[$0]; 
break;
case 15: this.$ = $$[$0]; 
break;
}
},
table: [{3:1,4:2,6:4,7:[1,6],18:[1,3],19:[1,5]},{1:[3]},{5:[1,7],9:[1,8],10:[1,9],11:[1,10],12:[1,11],13:[1,12],14:[1,13],15:[1,14],16:[1,15],17:[1,16]},{4:17,6:4,7:[1,6],18:[1,3],19:[1,5]},{5:[2,14],8:[1,18],9:[2,14],10:[2,14],11:[2,14],12:[2,14],13:[2,14],14:[2,14],15:[2,14],16:[2,14],17:[2,14]},{5:[2,15],9:[2,15],10:[2,15],11:[2,15],12:[2,15],13:[2,15],14:[2,15],15:[2,15],16:[2,15],17:[2,15]},{5:[2,2],8:[2,2],9:[2,2],10:[2,2],11:[2,2],12:[2,2],13:[2,2],14:[2,2],15:[2,2],16:[2,2],17:[2,2]},{1:[2,1]},{4:19,6:4,7:[1,6],18:[1,3],19:[1,5]},{4:20,6:4,7:[1,6],18:[1,3],19:[1,5]},{4:21,6:4,7:[1,6],18:[1,3],19:[1,5]},{4:22,6:4,7:[1,6],18:[1,3],19:[1,5]},{4:23,6:4,7:[1,6],18:[1,3],19:[1,5]},{4:24,6:4,7:[1,6],18:[1,3],19:[1,5]},{4:25,6:4,7:[1,6],18:[1,3],19:[1,5]},{4:26,6:4,7:[1,6],18:[1,3],19:[1,5]},{4:27,6:4,7:[1,6],18:[1,3],19:[1,5]},{5:[2,13],9:[2,13],10:[2,13],11:[2,13],12:[2,13],13:[2,13],14:[2,13],15:[2,13],16:[2,13],17:[2,13]},{7:[1,28]},{5:[2,4],9:[2,4],10:[2,4],11:[1,10],12:[1,11],13:[1,12],14:[1,13],15:[1,14],16:[1,15],17:[1,16]},{5:[2,5],9:[2,5],10:[2,5],11:[1,10],12:[1,11],13:[1,12],14:[1,13],15:[1,14],16:[1,15],17:[1,16]},{5:[2,6],9:[2,6],10:[2,6],11:[2,6],12:[2,6],13:[2,6],14:[2,6],15:[2,6],16:[2,6],17:[2,6]},{5:[2,7],9:[2,7],10:[2,7],11:[2,7],12:[2,7],13:[2,7],14:[2,7],15:[2,7],16:[2,7],17:[2,7]},{5:[2,8],9:[2,8],10:[2,8],11:[2,8],12:[2,8],13:[2,8],14:[2,8],15:[2,8],16:[2,8],17:[2,8]},{5:[2,9],9:[2,9],10:[2,9],11:[2,9],12:[2,9],13:[2,9],14:[2,9],15:[2,9],16:[2,9],17:[2,9]},{5:[2,10],9:[2,10],10:[2,10],11:[2,10],12:[2,10],13:[2,10],14:[2,10],15:[2,10],16:[2,10],17:[2,10]},{5:[2,11],9:[2,11],10:[2,11],11:[2,11],12:[2,11],13:[2,11],14:[2,11],15:[2,11],16:[2,11],17:[2,11]},{5:[2,12],9:[2,12],10:[2,12],11:[2,12],12:[2,12],13:[2,12],14:[2,12],15:[2,12],16:[2,12],17:[2,12]},{5:[2,3],8:[2,3],9:[2,3],10:[2,3],11:[2,3],12:[2,3],13:[2,3],14:[2,3],15:[2,3],16:[2,3],17:[2,3]}],
defaultActions: {7:[2,1]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == 'undefined') {
        this.lexer.yylloc = {};
    }
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === 'function') {
        this.parseError = this.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || EOF;
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + this.lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: this.lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: this.lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                this.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.2.1 */
var lexer = (function(){
var lexer = {

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input) {
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0: return 19 
break;
case 1: return 7 
break;
case 2: return 8 
break;
case 3: return yy_.yytext 
break;
case 4: return yy_.yytext 
break;
case 5: return yy_.yytext 
break;
case 6: return yy_.yytext 
break;
case 7: return yy_.yytext 
break;
case 8: return yy_.yytext 
break;
case 9: return yy_.yytext 
break;
case 10: return yy_.yytext 
break;
case 11: return yy_.yytext 
break;
case 12: return yy_.yytext 
break;
case 13: /*ignore whitespace*/ 
break;
case 14: return 5; 
break;
}
},
rules: [/^(?:\d+)/,/^(?:[\$\w]+)/,/^(?:\.(?=[\$\w]))/,/^(?:<=)/,/^(?:>=)/,/^(?:===)/,/^(?:==)/,/^(?:>)/,/^(?:<)/,/^(?:!=)/,/^(?:&&)/,/^(?:\|\|)/,/^(?:!)/,/^(?:\s+)/,/^(?:$)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14],"inclusive":true}}
};
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parse;
exports.Parser = parse.Parser;
exports.parse = function () { return parse.parse.apply(parse, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}
return parse; 
});

KISSY.add('kg/bidi/2.0.0/expression/index',function(S, Parse){

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

KISSY.add('kg/bidi/2.0.0/models',function(S, evaluation){

  "use strict";

  function Model(obj, augment){

    var attributes;

    function Attr(){}

    if (augment) {

      S.augment(Attr, augment);

      attributes = new Attr();
      S.mix(attributes, obj);

    } else {

      attributes = obj;

    }

    this.attributes = attributes;

    this.linkages = {};
    this.lists = {};

    return this;
  }

  S.augment(Model, S.EventTarget, {

    /**
     * @private
     */
    _isFunc: function(key, parent){
      var val;
      if (parent) {
        val = this._getParent(parent)[key];
      } else {
        val = this._getAttr(key);
      }

      return S.isFunction(val);
    },

    setLists: function(key){
      this.lists[key] = true;
    },

    /**
     * get方法，获取key值，默认情况下，直接从数据根节点获取数据，如果parent参数
     * 不为空，则通过parent来查找变量
     * @public
     * @param {string} key 需要查找的变量的key
     * @param {undefined|object} parent key的范围，默认为根节点
     */
    get: function(key, parent){ 

      if (parent) {
        return this._getByParent(key, parent);
      }

      var val = this._getAttr(key);

      if (typeof val == 'function' && !this.__forbidden_call) {
        val = val.call(this);
      }

      if (this.__recode) {
        this.__getter.push(key);
      }

      return val;
    },

    /**
     * 和this.get一样，只是call用于处理函数，并且可以自定义其他参数和函数执行上下文
     * @param {string} key 支持字符串和点操作，函数获取路径
     * @param {array} args 其他参数
     * @param {object|undefined} context 函数执行上下文
     * @param {object} parent
     * @return this
     */
    call: function(key, args, context, parent){

      var fn = this._getAttr(key);
      if (!S.isFunction(fn)) return this;

      args = S.isArray(args) ? args : [args];
      context = context || this;

      if (parent) {
        args.push(this.get(null, parent));
      }

      return fn.apply(context, args);

    },

    _getLinkage: function(key, ret){

      var _key, _paths;
      _paths = key.split('.');

      S.each(this.linkages, function(v, linkKey){

        if (key.indexOf(linkKey) === 0){

          _key = linkKey;

          var paths = _key.split('.');
          var filter = this.item(v);
          var last = paths[0];

          S.each(paths, function(path){
            ret = ret[path];
            if (ret === undefined) return false;
          });

          _paths = _paths.slice(paths.length);

          if (filter && filter[last]) {
            filter = filter[last];
            ret = S.filter(ret, function(item){
              return item && S.indexOf(item.value, filter) > -1;
            });
          } else if (filter || filter === undefined) {
            //当filter等于null的时候，说明关联的字段不存在，这样返回全部
            ret = undefined;
          }

          return false;
        }

      }, this);

      return { key: _key, value: ret, paths: _paths };

    },

    _getAttr: function(key, base){

      var ret = base || this.attributes;
      var paths = key.split('.');

      var linkage = this._getLinkage(key, ret);

      if (linkage.key) {
        ret = linkage.value;
        paths = linkage.paths;
      }

      //$aa.$item.attr
      if (paths.length > 2 && paths[1] === '$item') {
        ret = this.item(paths[0]);
        paths = paths.slice(2);

        if(!ret) return ret;
      }

      S.each(paths, function(path){
        ret = ret && ret[path];
        if (ret === undefined) return false;
      });

      return ret;
    },

    /**
     * 获取某个表单所对应的对象，通常，如果是一个select或者radio，一个select对应
     * 的$values有多个，item根据select的$defaultValue所对应的对象
     */
    item: function(key){

      var items = this.get(key);

      if (items) {
        var val = items.defaultValue;
        items = items.values;
      } else {
        return null;
      }

      var ret;

      if (!items) return ret;

      S.some(items, function(item){
        if (item.value == val) {
          ret = item;
          return true;
        }
      });

      return ret;

    },
    /**
     * 获取key来查找，parent对象定义了key所处的id和根节点name
     * @private
     */
    _getByParent: function(key, parent){

      var ret;
      var root = false;
      if (key && key.indexOf('$root.') === 0) {
        ret = this._getAttr(key.slice(6));
        root = true;
      } else {
        var val = this._getParent(parent);
        ret = key !== null? this._getAttr(key, val): val;
      }

      if (S.isFunction(ret)){
        if (!root) {
          //如果在list中，函数第一个参数是，list所在的对象
          val.parent = this;
          ret = ret.call(val, parent);
        } else {
          ret = ret.call(this, this.get(null, parent));
        }
      }

      if (this.__recode) {
        this.__getter.push(parent.name + ':' + parent.id);
      }

      return ret;
    },

    /**
     * @private
     */
    _getParent: function(parent){

      // this.set('xxx', 'seat');
      if (parent.__parent__) return parent;

      var name = parent.name;
      var o = this.get(name);
      var ret = {};

      S.some(o, function(val){

        if (val['__parent__'].id === parent.id) {
          ret = val;
          return true;
        }

      }, this);

      return ret;
    },

    getRelated: function(key, parent){

      if (this._isFunc(key, parent)) {

        this.__recode = true;
        this.__getter = [];
        this.get(key, parent);
        this.__recode = false;

        return this.__getter.slice();

      } else {

        return parent ? [parent.name + ':' + parent.id] : [key];

      }

    },

    /**
     * return json object of attributes
     */
    toJSON: function(){ 

      var json = {};

      this.__forbidden_call = true;

      S.each(this.attributes, function(val, key){

        if (this.attributes.hasOwnProperty(key)) {
          json[key] = this.get(key);
        }

      }, this); 

      delete this.__forbidden_call;

      return json;
    },

    /**
     * 绑定change:xxx事件封装，直接使用this.on('change:' + xxx)感觉不好，另外支
     * 持传入一个数组，对于多个属性封装，使用数组更方便
     * @param {array|string} key 需要绑定change事件的属性
     * @param {function} fn 回调函数
     * @param {object|undefined} context 执行上下文，可以不填
     * @return this
     */
    change: function(key, fn, context){

      var evt = '';

      if (S.isArray(key)){

        evt = S.map(key, function(name){
          return 'change:' + name + ' add:' + name + ' remove:' + name;
        }).join(' ');

      } else {
        evt = 'change:' + key;
      }

      this.on(evt, fn, context);

      return this;

    },

    /**
     * 赋值方法，通过set，修改属性值，并且，触发事件
     * @param {string} key 属性的key
     * @param {object} value
     * @param {object|undefined} parent 定义parent，在list中需要用到
     * @public
     * @return this
     */
    set: function(key, value, parent){

      //判断一个key是否是逻辑表达式，比如a > b, a == b，如果是，不执行set操作
      if (/[<=>!|&]+/.test(key)) {
        return;
      }

      // 临时禁止set方法，在toJSON方法调用的时候需要如此
      if (this.__forbidden_call) return;

      if (parent) {
        return this._setByParent(key, value, parent);
      }

      var paths = key.split('.');
      var attr = this.attributes;
      var len = paths.length;

      S.each(paths, function(path, i){

        if (path in attr && i < len - 1) {
          attr = attr[path];
        } else {
          return false;
        }

      });

      var last = paths[len - 1];

      //如果是list，给每个元素增加一个属性
      if (key in this.lists) this._addToken(key, value);

      //if (attr[last] == value) return this;

      attr[last] = value;

      this.fire('change:' + paths[0], {path: paths.slice(1), val: value});
      return this;

    },

    //增加parent的标志
    _addToken: function(key, lists){
      S.each(lists, function(list){
        list['__parent__'] = { name: key, id: S.guid('$id') };
      })
    },

    /**
     * 删除集合中的一个元素
     * @param {object} obj 集合元素
     * @public
     * @return this
     */
    remove: function(obj){

      if (this.__forbidden_call) return;

      if (obj.__parent__)
        obj = obj.__parent__;

      var parentKey = obj.name;
      var lists = this.get(parentKey);
      var index;

      S.some(lists, function(list, i){
        if (list['__parent__'].id === obj.id){
          index = i;
          return true;
        }
      });

      //删除元素
      lists.splice(index, 1);
      this.fire('remove:' + parentKey, {id: obj.id, index: index});

      return this;
    },

    /**
     * 在list中添加一个元素
     * @param {object} obj 需要加入元素
     * @param {string} key 需要增加的属性
     * @public
     */
    add: function(obj, key){

      if (this.__forbidden_call) return;

      obj['__parent__'] = { id: S.guid('$id'), name: key};
      var lists = this.get(key);

      lists.push(obj);
      this.fire('add:' + key, {obj: obj});

      return this;
    },

    /**
     * @private
     */
    _setByParent: function(key, value, parent){

      var o = this._getParent(parent);
      if (o) o[key] = value;

      var _p = parent.__parent__ || parent;
      this.fire('change:' + _p.name, { $item: _p.id });
      this.fire('change:' + _p.name + ':' + _p.id);
    },

    /**
     * 对表达式求值
     * @return {object} { val: Boolen, related: Array }
     */
    evaluation: function($control){
      return evaluation($control);
    },

    setLinkage: function(key, val){
      this.linkages[key] = val;
      return this;
    }

  });

  return Model;

}, {
  requires: [
    './expression/index',
    'event'
  ]
});

KISSY.add('kg/bidi/2.0.0/watch/text',function(S){

  "use strict";

  function add(watch){
    
    watch.add('text', {

      init: function(){

        var $control = this.$control;
        var model = $control('model');
        var key = $control('key');

        var el = $control('el');
        var expr = model.evaluation($control);

        var argv = $control('argv');
        var pipe = argv[0];

        model.change(expr.related, function(){

          var val = model.evaluation($control).val;

          if (pipe && pipe in watch.pipe){
            val = watch.pipe[pipe](val);
          }

          el.html(val);

        }, this)

      },

      beforeReady: function(){

        var $control = this.$control;
        var model = $control('model');
        var val = model.evaluation($control).val || '';
        var argv = $control('argv');
        var pipe = argv[0];

        if (pipe && pipe in watch.pipe){
          val = watch.pipe[pipe](val);
        }

        this.$html = ' id=' + $control('id') + '>' + val + '<!----';
        watch.noEscape[this.$html] = true;

      }

    });

  }

  return add;

});

KISSY.add('kg/bidi/2.0.0/watch/class',function(S){

  "use strict";

  return function(watch){

    watch.add('class', function(){

      var $control = this.$control;
      var model = $control('model');
      var key = $control('key');
      var classname = $control('argv')[0];

      var expr = model.evaluation($control);

      model.change(expr.related, change);

      function change(){
        var el = $control('el');
        var fn = model.evaluation($control).val ? 'addClass': 'removeClass';
        el[fn](classname);
      }

      change();

    });

  }

});

KISSY.add('kg/bidi/2.0.0/watch/click',function(S){

  "use strict";

  return function(watch){

    watch.add('click', function(){

      var $control = this.$control;
      var model = $control('model');
      var key = $control('key');
      var selector = $control('selector');

      $control('base').delegate('click', selector, function(){
        model.get(key, $control('parent'));
      });

    });

  }

} );

KISSY.add('kg/bidi/2.0.0/watch/select',function(S){

  "use strict";

  return function(watch){

    watch.add('select', function(){

      var $control = this.$control;
      var model = $control('model');
      var key = $control('key');
      var el = $control('el');
      var parent = $control('parent');

      var expr = model.evaluation($control);
      el.val(expr.val);

      model.change(expr.related, function(e){
        var val = model.get(key, parent);
        el.val(val);
      });

      el.on('change', function(){
        model.set(key, el.val(), parent);
      });

    });

  }

}, {
});

KISSY.add('kg/bidi/2.0.0/watch/attr',function(S){

  "use strict";

  return function(watch){

    watch.add('attr', function(){

      var $control = this.$control;
      var model = $control('model');
      var key = $control('key');
      var expr = model.evaluation($control);

      attr(expr.val);

      model.change(expr.related, function(){
        attr(model.evaluation($control).val);
        model.fire( 'render:attr', {key: key, el: $control('el')} )
      });

      var el = $control('el');

      //el.on('change', function(){
        //var attrname = $control('argv')[0];
        //var val = el.attr(attrname);
        //model.set(key, val, $control('parent'))
      //});

      function attr(val){
        var el = $control('el');
        var attrname = $control('argv')[0];
        el.attr(attrname, val);
      }

    });

  }

});

KISSY.add('kg/bidi/2.0.0/watch/each',function(S, XTemplate){

  "use strict";

  function getValue(el){

    var ret;

    if (el.getDOMNode().tagName.toLowerCase() == 'select') {
      return el.val();
    }

    el.all('input').each(function(element){
      if (element.attr('checked')) {
        ret = element.val();
      }
    });

    return ret;

  }

  function add(watch){

    watch.add('linkage', {

      init: function(){


        var $control = this.$control;

        var model = $control('model');
        var key = $control('key');
        var linkage = $control('argv')[0];
        var el = $control('el');
        var paths = key.split('.');

        model.change(linkage, function(){

          var fn = $control('fn');

          var html = new XTemplate(fn);
          var option = {params: [model.get(key)], fn: fn};
          var scopesNew = $control('scopes').slice();
          scopesNew.unshift(model.get(key));
          html = html.config.commands.each(scopesNew, option);

          // 火狐下对select进行innerHMTL有bug
          // 在低端android浏览器，也有这个问题，全部使用innerHMTL
          //if (S.UA.firefox) {
          el[0].innerHTML = html;
          //} else {
            //var ret = el.html(html);
          //}

          model.set(paths[0] + '.defaultValue', getValue(el));
          $control('view').fire('inited');
          model.fire('render:linkage', { key: key, el: el });

        });

        var val = getValue(el);
        if (val) {
          model.set(paths[0] + '.defaultValue', val);
        }
      },


      beforeReady: function(){

        var $control = this.$control;
        var model = $control('model');
        var key = $control('key');
        var linkage = $control('argv')[0];

        model.setLinkage(key, linkage);
      }

    });

  }

  return add;

}, {
  requires: ['../xtemplate']
});

KISSY.add('kg/bidi/2.0.0/watch/radio',function(S){

  "use strict";

  function getRadioValue(el){

    var ret;

    el.all('input').each(function(element){
      if (element.attr('checked')) {
        ret = element.val();
      }
    });

    return ret;

  }

  return function(watch){

    watch.add('radio', function(){

      var $control = this.$control;
      var model = $control('model');
      var key = $control('key');
      var el = $control('el');

      el.delegate('change', 'input', function(e){

        var target = S.all(e.currentTarget);
        var val = target.val();

        model.set(key, val);

      });

      var val = getRadioValue(el);

      if (val && model.get(key) != val) {
        S.later(function(){
          model.set(key, val);
        });
      }

    });

  };

}, {
});

KISSY.add('kg/bidi/2.0.0/watch/list',function(S, XTemplate){

  "use strict";

  function add(watch){

    watch.add('list', {

      init: function(){

        var $control = this.$control;
        var self = this;

        var model = $control('model');
        var key = $control('key');

        model.on('remove:' + key, function(e){

          var el = $control('el').children();
          var index = e.index;
          el.item(index).remove();

        });

        model.on('add:' + key, function(e){

          var fn = $control('fn');
          var option = {params: [e.obj], fn: fn};

          var json = model.toJSON();
          json['__name__'] = $control('name');

          var html = option.fn([e.obj, json]).replace(/^>/, '');
          $control('el').append(html);

          $control('view').fire('inited');

        });

        this._bindChange();
      },

      _bindChange: function(){

        var $control = this.$control;
        var model = $control('model');
        var key = $control('key');

        model.change(key, function(e){

          if (e.$item) return;

          var fn = $control('fn');
          var option = {params: [e.val], fn: fn};

          var json = model.toJSON();
          json['__name__'] = $control('name');

          var html = new XTemplate(fn);
          html = html.config.commands.each([e.val, json], option);

          $control('el').html(html);
          $control('view').fire('inited');

        });

      },

      beforeReady: function(){
        var $control = this.$control();
        var model = $control.model;
        model.setLists($control.key);
      }

    });

  }

  return add;

}, {
  requires: ['../xtemplate']
});

KISSY.add('kg/bidi/2.0.0/watch/with',function(S, XTemplate){

  "use strict";

  function add(watch){

    watch.add('with', {

      init: function(){

        var $control = this.$control;
        var model = $control('model');
        var key = $control('key');

        model.change(key, function(e){

          if (e.$item || e.path.length) return;

          var fn = $control('fn');
          var option = {params: [e.val], fn: fn};

          var json = model.toJSON();
          json['__name__'] = $control('name');

          var html = option.fn([e.val, json]);

          $control('el').html(html);
          $control('view').fire('inited');

        });

      },

      beforeReady: function(){
        //var $control = this.$control();
        //var model = $control.model;
        //model.setLists($control.key);
      }

    });

  }

  return add;

}, {
  requires: ['../xtemplate']
});

KISSY.add('kg/bidi/2.0.0/watch/action',function(S){

  "use strict";

  return function(watch){

    watch.add('action', function(){

      var $control = this.$control;
      var model = $control('model');
      var evt = $control('key');
      var selector = $control('selector');
      var argv = $control('argv');
      var fn = argv[0];

      if (fn) {
        $control('el').on(evt, function(e){
          var parent = $control('parent');
          model.call(fn, e, null, parent);
        });
      }
    });

  }

} );

KISSY.add('kg/bidi/2.0.0/watch/print',function(S){

  "use strict";

  return function(watch){

    //print命令，只在模板渲染时候运行，如果key的运算为true，则返回第二个字符串，
    //或者key运算的返回值，不做任何的绑定
    watch.add('print', {

      init: function(){},

      beforeReady: function(){
        var $control = this.$control;
        var model = $control('model');
        var val = model.evaluation($control).val;
        var text = $control('argv')[0];
        if (val) {
          this.$html = text || val;
        } else {
          this.$html = '';
        }
      }
    });

  }

});

KISSY.add('kg/bidi/2.0.0/watch/value',function(S){

  "use strict";

  function add(watch){

    watch.add('value', {

      init: function(){

        var $control = this.$control();
        S.mix(this, $control);
        this._render();

      },

      beforeReady: function(){
        var $control = this.$control;
        var key = $control('key');
        var model = $control('model');
        var val = model.evaluation($control).val;

        if (val) {
          this.$html = ' value= ' + val + ' id=' + $control('id') + ' ';
        }
      },

      _render: function(){

        var el = this.el;
        var type = el.attr('type') || 'input';
        var model = this.model;
        var key = this.key;

        if (type == 'radio') {
          this._bindRadio();
        } else {
          //el.val(model.get(key));
          this._bindEvent();
        }

      },

      _bindRadio: function(){

        var el = this.el;
        var model = this.model;
        var base = this.base;
        var name = el.attr('name');
        var key = this.key;

        base.delegate('click', 'input', function(e){

          var target = e.currentTarget;

          if (target.type == 'radio' && target.name == name) {
            var val = el.attr('checked');
            model.set(key, val);
          }

        });

        model.change(key, function(){
          el.attr('checked', model.get(key));
        });

        var isChecked = el.attr('checked');

        //默认值配置
        if (isChecked) {
          model.set(key, isChecked);
        }

      },

      _bindEvent: function(){

        var el = this.el;
        var model = this.model;
        var key = this.key;
        var $control = this.$control;
        var expr = model.evaluation($control);
        var parent = this.parent;

        el.on('keyup change', function(){

          var val = el.val();
          model.set(key, val, parent);

        });

        model.change(expr.related, function(){
          var val = model.evaluation($control).val || '';
          el.val(val);
        });

      }

    });

  }

  return add;

}, {
});

KISSY.add('kg/bidi/2.0.0/watch/index',function(S){

  "use strict";

  var watchers = {};
  var watch = {}

  watch.noEscape = {};

  var esc = S.escapeHTML;
  //重写escapeHtml方法，增加白名单
  S.escapeHTML = function(s){
    return s in watch.noEscape ? s: esc(s);
  };

  watch.add = function(name, watcher){

    if (name in watchers) {
      S.error(name + ' has be add before');
    }

    if (S.isFunction(watcher)) {
      watcher = { init: watcher };
    }

    /**
     * cfg: el, key, model, base
     */
    watchers[name] = function(cfg){

      var $control = {};

      S.mix($control, cfg);

      this.$control = function(key, val){

        // $control() return all varialbe accessible
        if (!key) return S.mix($control, {});

        // $control(key)
        if (!val) return $control[key]; 
        
        //一次性写入
        // $control(key, val)
        if (!(key in $control)) $control[key] = val;

      };

      this.beforeReady && this.beforeReady();

      this.on('ready', this.init, this);

    };

    S.augment(watchers[name], S.EventTarget, watcher);

  };

  watch.get = function(name){
    return watchers[name];
  };

  watch.pipe = {};

  S.each(arguments, function(fn, i){
    if (i) fn(watch);
  });

  return watch;

}, {
  requires: [
    './text',
    './class',
    './click',
    './select',
    './attr',
    './each',
    './radio',
    './list',
    './with',
    './action',
    './print',
    './value'
  ]
});

KISSY.add('kg/bidi/2.0.0/views',function(S, Event, XTemplate, Watch){

  "use strict";

  function View(name, model, html){

    this.model = model;
    this.name = name;
    this.elements = [];
    this.html = html;

  }

  S.augment(View, S.EventTarget, {

    setEl: function(el){

      this.el = el;
      var html = this.html ? this.html : el.all('script').html();

      this.template = new XTemplate(html);

      if (this.template) {
        S.log('get template html from script/xtempalte');
      } else {
        S.error('Get template html form script/xtempalte, got none');
      }

      return this;

    },

    render: function(){

      var json = this.model.toJSON();
      json['__name__'] = this.name;

      S.log('start render xtempalte for bidi-' + this.name);

      var html = this.template.render(json);
      html = html.replace(/>\s+>>><<</g, '');

      //this.el.html(html);
      // ie 中el.html有点问题
      this.el.getDOMNode().innerHTML = html;

      this.fire('inited');

      return this;
    },

    /**
     * 通过绑定的key来获取dom节点，返回第一个dom节点
     */
    get: function(key){

      var ret;

      S.some(this.elements, function(element){
        if (element.key === key) {
          ret = element.el;
          return true;
        }
      });

      return ret;
    },

    /**
     * 通过绑定的key来获取所有的dom节点
     */
    getAll: function(key){

      var ret = [];

      S.each(this.elements, function(element){
        if (element.key === key) {
          ret.push(element.el);
        }
      });

      return ret;
    },

    watch: function(params, fn, scopes){

      var who = params[0];
      var key = params[1];
      var watcher = Watch.get(who);
      var id = params.id || 'bidi-' + this.name + '-' + S.guid();
      var selector = '#' + id;
      var argv = params.slice(2);
      var html = ' id=' + id + ' ';
      var meta = params.meta;

      if (watcher) {

        var w = new watcher({
          // watcher所对应的dom id选择器
          selector: selector,
          // 如果是list下一个元素，parent记录了父元素相关信息
          parent: meta,
          // id选择器对应的id，没有符号"#"
          id: id,
          // 绑定的数据对象键值
          key: key, 
          // 数据对象，model
          model: this.model,
          // view对应的NodeList
          base: this.el,
          // XTemplate执行函数，只在block语法下需要，比如linkage、list
          fn: fn,
          // XTemplate执行时上下文，再次渲染模板，需要保持上下文环境
          scopes: scopes,
          // 其他参数，{{watch "text: key: argv0: argv1}}
          argv: argv,
          name: this.name,
          view: this
        });

        var _init = function(){
          // dom ready
          var el = this.el.all(selector);
          w.$control('el', el);
          w.fire('ready');

          this.elements.push( { key: key, el: el } );
          this.detach('inited', _init);
        };

        this.on('inited', _init);

        html = w.$html === undefined ? html : w.$html;

      } else {

        S.log('watcher ' + who + ' is not defined!');

      }

      return { id: id, html: html };
    }

  });

  return View;

}, {
  requires: [
    'event',
    './xtemplate',
    './watch/index'
  ]
});

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
KISSY.add('kg/bidi/2.0.0/macros',function(){

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

/**
 * @fileoverview 请修改组件描述
 * @author hanwen.sah<hanwen.sah@taobao.com>
 * @module bidi
 **/
KISSY.add('kg/bidi/2.0.0/index',function (S, Node, Base, XTemplate, Model, View, Watcher, macro){

  //firefox下，Object.prototype.watch存在，导致xtempalte运行挂了
  delete Object.prototype.watch;

  var EMPTY = '';
  var $ = Node.all;
  var Views = {};
  //记录list下面元素所对应的parent
  var META = '__parent__';
  //记录view视图的名字
  var NAME = '__name__';

  function getProperty(parts, scopes, depth) {
    // this refer to current scope object
    if (parts === '.') {
      parts = 'this';
    }
    parts = parts.split('.');
    var len = parts.length, i, j = depth || 0, v, p, valid, sl = scopes.length;

    // root keyword for root scope
    if (parts[0] == 'root') {
      j = sl - 1;
      parts.shift();
      len--;
    }
    for (; j < sl; j++) {
      v = scopes[j];
      valid = 1;
      for (i = 0; i < len; i++) {
        p = parts[i];
        if (p === 'this') {
          continue;
        }
        // may not be object at all
        else if (typeof v != 'object' || !(p in v)) {
          valid = 0;
          break;
        }
        v = v[p];
      }
      if (valid) {
        // support property function return value as property value
        if (typeof v == 'function') {
          v = v.call(scopes[0]);
        }
        return [v];
      }
    }
    return false;
  }
  
  /**
   * 处理双向绑定分发的函数, watch自定义命令，注入到xtemplate执行过程中
   */
  function watch(scopes, option, fnName){

    var id;
    var len = scopes.length - 1;
    var name = scopes[len][NAME];
    var ret;
    var meta = scopes[0][META];
    var viewNow = Views[name];

    if (!option.params) {
      return getProperty(fnName, scopes, {});
    }

    S.log('bidi-' + name + ' add watch: ' + option.params.join(','));

    S.each(option.params, function(param, i){

      var params = S.map(param.split(':'), S.trim);
      if (meta) params.meta = meta;

      if (!option.fn) {

        if (id) {

          params.id = id;
          viewNow.watch(params);

        } else {

          var o = viewNow.watch(params);
          id = o.id;
          ret = o.html;

        }

      } else {

        if (!id) {

          var o = viewNow.watch(params, option.fn, scopes);
          id = o.id;
          var fn = params[0];

          if (fn in Block) {
            ret = Block[fn](scopes, option, params, name, o.html);
          } else {
            S.log('watch block command no support ' + fn);
          }

        } else {

          params.id = id;
          viewNow.watch(params);

        }

      }

    });

    return ret;
  }

  // 块级语法支持，需要一些特殊的处理
  var Block = {

    linkage: function(scopes, option, params, name, html){

      var model = Views[name].model;

      var eachFn = Views[name].template.config.commands.each;

      S.log('linkage start run')
      //重新计算，这时候model的value会有改变
      scopes[0]['$$linkage'] = model.get(params[1]);

      //调用XTemplate的each命令
      option.params[0] = scopes[0]['$$linkage'];
      var buf = eachFn(scopes, option);

      delete scopes[0]['$$linkage'];

      S.log('linkage start run success')
      return ' >>><<<' + html + '>' + buf;

    },

    list: function(scopes, option, params, name, html){

      var model = Views[name].model;
      var len = scopes.length - 1;

      option.params[0] = scopes[0][params[1]];

      var param0 = option.params[0] || [];
      var opScopes = [0, 0].concat(scopes);
      var xcount = param0.length;

      var buf = '';

      for (var xindex = 0; xindex < xcount; xindex++) {
        // two more variable scope for array looping
        opScopes[0] = param0[xindex];

        if (!opScopes[0][META]) {
          opScopes[0][META] = { id: S.guid('$id'), name: params[1]};
        }

        opScopes[1] = {
          xcount: xcount,
          xindex: xindex
        };
        buf += option.fn(opScopes).replace(/^>/, '');
      }

      return ' >>><<<' + html + '>' + buf;

    },

    'with': function(scopes, option, params, name, html){

      var model = Views[name].model;
      var len = scopes.length - 1;

      option.params[0] = scopes[0][params[1]];

      var param0 = option.params[0];
      var opScopes = [param0].concat(scopes);

      var buf = option.fn(opScopes).replace(/^>/, '');

      return ' >>><<<' + html + '>' + buf;

    }

  };

  // 缓存已经注册到XTemplate中的命令，避免重复执行
  var commands = {};
  // for Bidi.active function
  function addCommand(name){

    if (name in commands) return;

    var fn = function(scopes, option){
      S.each(option.params, function(param, i) {
        option.params[i] = name + ':' + param;
      });
      return watch(scopes, option, name);
    }

    commands[name] = fn;

  }

  var Bidi = {

    /**
     * 激活命令，比如Bidi.active('text'), 那么可以在模板中写 
     * {{text "key"}} == {{watch "text: key"}}
     * @param {string|array} name 需要激活的命令，注册到XTemplate的自定义命令中
     * @static
     */
    active: function(name){

      //if (S.isArray(name)){
        //S.each(name, addCommand);
      //} else {
        //addCommand(name);
      //}

    },

    xbind: function(name, obj, augment, template){

      if (!S.isString(name)) {
        throw new Error('Bidi init fail, name must be string');
      }

      Views[name] = new View(name, new Model(obj, augment), template);
      S.log('init bidi, add view ' + name)
      return Views[name];

    },

    init: function(grep){

      $(".bidi-viewer").each(function(el){

        var name = el.attr('data-view');

        //grep过滤
        if (grep && name.indexOf(grep) < 0) return;

        var view = Views[name].setEl(el);

        //添加命令
        view.template.addCommand('watch', watch);
        S.each(commands, function(fn, cmd){
          view.template.addCommand(cmd, fn);
        });

        view.render();
      });

    },

    // add custom watcher
    add: function(name, obj){
      Watcher.add(name, obj);
    },

    // add pipe function
    pipe: function(name, fn){
      Watcher.pipe[name] = fn;
    },

    registerHelper: this.pipe

  };

  //Bidi.active(['print']);
  return Bidi;

}, {
  requires:[
    'node', 
    'base',
    './xtemplate',
    './models',
    './views',
    './watch/index',
    './macros'
  ]
});

