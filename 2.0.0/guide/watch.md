## watch汇总

### 概述

绑定的语法，是XTemplate模板的自定义函数，基本形式`<div {{watch "fn:watch_key:optionnal" "watch2"}}>`.

watch，也就是绑定js变量过程，bidi的绑定的实现是通过{{watch "xxx"}}为所在的dom生
成id，比如上面的代码，生成html就是`<div id="bidi-1231">`，watch本身会执行一个函
数，这个函数会生成这个id，并且记录在内存中，通过这个id，来找到绑定对应的dom节点。

这样，某个dom元素需要绑定，有两点必要条件

1. 每个变量必须和一个dom元素绑定，孤立的watch预发是没法实现绑定，比如`<p>hello, {{watch "text: name"}}`
   这种是不支持，必须改成`<p>hello, <em {{{watch "text: name"}}}></em>`
2. 绑定js变量的dom节点，不能存在id属性，比如`<p id="a" {{watch "text: name"}}>`
   这种方法会无法生效，因为在模板生成过程，记录的id无法找到对应的dom节点了。

### 绑定规则

上面的基本形式中，{{watch "fn:watch_key:optionnal"}}，watch是一个XTemplate的自定
义函数，后面的"fn:watch_key:optionnal"是参数，这个参数是一个字符串，这个字符串用
于描述绑定规则。

绑定规则指定了dom元素和js变量之间的关系，一般的关系分为两种：

- 单项关系，通常是js变量的变化改变dom的一些属性
- 双向绑定，一般是表单元素，表单元素本身是有值的，这个值可以修改js变量的值

watch后面的参数，通过分号分割，第一部分是绑定函数，第二部分是一个表达式，第三
部分是其他参数。下面举一个例子：

```
<button {{watch "attr: seats.length > 5: disabled"}}></button>
```

这样语法，表示，当`seats.length`发生变化的时候，会执行属性修改函数

```
button.attr('disabled', model.evaluation('seats.length > 5'))
```

最终达到的效果，seats.length的值大于5的时候，button元素的disabled属性为true，反
之，disabled属性为false。这样，可以控制一个按钮是否可用。

### text: var : pipe

text行为改变dom的text值，*text绑定是唯一需要使用{{{}}}的绑定函数* 。var可以是函数、
或者变量，如果是函数，函数中获取属性，需要通过`this.get('xxx')`的方式。

第三个参数，pipe是一个助手函数，可以没有，使用前，需要注册函数。

```
  //{{watch "text: price: formattedPrice"}}
  function formattedPrice(price){
    return price ? "$" + price.toFixed(2) : "None";
  }   
  Bidi.pipe('formattedPrice', formattedPrice);
```

### attr: exp : attrname

比较简单，操作过程相当于el.attr(attrname, model.evaluation(exp))，表达式的求值
基本上等同于js运算。

### class: exp: classname

改变class名字，通过条件的是否，增加或者删除某个class，操作过程等同于：

```
if model.evaluation(exp) is true
  el.addClass(classname)
else
  el.removeClass(classname)
```

### click: fn

点击事件绑定，事件是通过代理实现的，第二个参数对应一个函数。

### linkage: key: relatedkey

联动关系，联动是操作在集合上，所以是块级命令。bidi使用的方案如下

![联动关系](http://gtms04.alicdn.com/tps/i4/T1ZvIIFjdkXXamTp3B-751-436.png)

联动元素的数据和表单元素的select或者radio集合形成对应，一个select应该有一个value，
和多个可选的value，对应的js对象如下：

```js
{
  problem: {
    defaultValue: 2,
    values: [
      {value: 1, text: '大小尺寸不符合', reasons: [11, 12]},
      {value: 2, text: '材料面料不符合', reasons: [21]},
      {value: 5, text: '颜色、款式、图案描述不符'}
    ]
  },
  reasons: {
    defaultValue: null,
    name: "reasons",
    values: [
      {value: 11, text: '尺寸、尺码不符'},
      {value: 12, text: '拼接、走线不齐'},
      {value: 21, text: '材质不符'},
    ]
  }
}

<select name="key1" {{watch "select: problem.defaultValue">
  {{#each problem.values}}
    <option value="{{value}}">{{text}}</option>
  {{/each}}
</select>
<div>
  {{#watch "linkage: reasons.values: problem"}}
    <label class="radio-inline"> <input type="radio" value="{{value}}"/>{{text}} </label>
  {{/watch}}
</div>
```

上面描述了一个最简单的联动关系，problem和reasons构成关联，绑定后执行的过程是，
首先，select选中的值和problem.defaultValue绑定，select修改的时候，会修改problem.defaultValue
的值，problem.defaultValue修改，触发linkage函数。

这里隐藏了一条关系，通过problem.defaultValue找到problem.items下value值想对应的
对象，然后reasons.values在linkage函数执行种，通过problem.$item.reasons获取到可
用的元素。$item表示problem中当前选中的元素，这个表达式，在其他地方一样可以使用。

这样通过problem.$item.reasons来关联reasons哪些元素，通过problem来对reasons的元素
进行分类，同样，在reasons的元素下，可以增加一层关系，这样可以实现n层关联。

### select: property

把select的值赋予属性，等同于 `model.set(property, el.val())`

### radio: property

与select比较类似，唯一的区别是，radio需要把值放在radio搜在的外层元素中，radio会
有很多元素，radio的值，是被选中的。

### value
