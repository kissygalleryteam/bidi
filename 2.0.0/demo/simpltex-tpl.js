/** Compiled By kissy-xtemplate */
KISSY.add(function () {
    return function (scopes, S, undefined) {
        var buffer = "",
            config = this.config,
            engine = this,
            utils = config.utils;
        var runBlockCommandUtil = utils["runBlockCommand"],
            getExpressionUtil = utils["getExpression"],
            getPropertyOrRunCommandUtil = utils["getPropertyOrRunCommand"];
        buffer += '<div class="panel panel-primary">\r\n    <div class="panel-heading">示例1,简单情况. <a class="pull-right" href="http://jsfiddle.net/AAEZP/1/embedded/result,html,js/">Edit It &gt;&gt;</a>\r\n    </div>\r\n    <p>hello, I am <strong ';
        var config1 = {};
        var params2 = [];
        params2.push('text: fullName');
        config1.params = params2;
        var id0 = getPropertyOrRunCommandUtil(engine, scopes, config1, "watch", 0, 4, false, undefined);
        buffer += id0;
        buffer += '></strong></p>\r\n    <p>hello, I am <strong ';
        var config4 = {};
        var params5 = [];
        params5.push('text: firstName');
        config4.params = params5;
        var id3 = getPropertyOrRunCommandUtil(engine, scopes, config4, "watch", 0, 5, false, undefined);
        buffer += id3;
        buffer += '></strong></p>\r\n    First Name: <input ';
        var config7 = {};
        var params8 = [];
        params8.push('value: firstName');
        config7.params = params8;
        var id6 = getPropertyOrRunCommandUtil(engine, scopes, config7, "watch", 0, 6, true, undefined);
        buffer += id6;
        buffer += '/><br>\r\n    Last Name: <input ';
        var config10 = {};
        var params11 = [];
        params11.push('value: lastName');
        config10.params = params11;
        var id9 = getPropertyOrRunCommandUtil(engine, scopes, config10, "watch", 0, 7, true, undefined);
        buffer += id9;
        buffer += '/> ';
        var id12 = getPropertyOrRunCommandUtil(engine, scopes, {}, "text", 0, 7, undefined, false);
        buffer += getExpressionUtil(id12, true);
        buffer += '\r\n\r\n    <button ';
        var config14 = {};
        var params15 = [];
        params15.push('click: capitalizeLastName');
        config14.params = params15;
        var id13 = getPropertyOrRunCommandUtil(engine, scopes, config14, "watch", 0, 9, true, undefined);
        buffer += id13;
        buffer += '>Go caps</button>\r\n</div>\r\n<input type="hidden" ';
        var config17 = {};
        var params18 = [];
        params18.push('attr: a == 1: disabled');
        config17.params = params18;
        var id16 = getPropertyOrRunCommandUtil(engine, scopes, config17, "watch", 0, 11, true, undefined);
        buffer += id16;
        buffer += '/>\r\n<input type="hidden" ';
        var config20 = {};
        var params21 = [];
        params21.push('attr: a === 1: disabled');
        config20.params = params21;
        var id19 = getPropertyOrRunCommandUtil(engine, scopes, config20, "watch", 0, 12, true, undefined);
        buffer += id19;
        buffer += '/>\r\n';
        return buffer;
    };
});
