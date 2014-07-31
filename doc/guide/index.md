## 综述

[![Build Status](https://travis-ci.org/shepherdwind/bidi.png?branch=master)](https://travis-ci.org/shepherdwind/bidi)
MVVM for KISSY

* 版本 
  - 1.0 for kissy 1.3.x
  - 1.1 for kissy 1.4.0
  - 1.2 for kissy 1.4.1
* demo：[http://kg.kissyui.com/bidi/1.1/demo/index.html](http://kg.kissyui.com/bidi/1.1/demo/index.html)
* todo app：[http://kg.kissyui.com/bidi/1.1/demo/todo/index.html](http://kg.kissyui.com/bidi/1.1/demo/todo/index.html)
* 教程：[http://kg.kissyui.com/bidi/1.1/guide/index.html](http://kg.kissyui.com/bidi/1.1/guide/index.html)
* spec：[http://kg.kissyui.com/bidi/1.1/spec/index.html](http://kg.kissyui.com/bidi/1.1/spec/index.html)

## 升级提示

2013-12-26 增加1.2版本，用于kissy 1.4.1，因为1.4.1改动过大，bidi没法再兼容下去

从1.0到1.1版本，改动主要是兼容kissy 1.4.0，因为api不一致，无法向后兼容，1.1不支
持kissy 1.3.x.

主要的改动是，

      <strong {{watch "fullname"}}></strong>

这种形式在1.0支持，在1.1，必须改成

      <strong {{{watch "fullname"}}}></strong>

三个括号的形式，不转义。

此外，1.0支持`Bidi.active`接口现在无效了，没法使用，容易和其他变量冲突。

### [watch语法](./watch.html)

### simple use

### 表单联动实现

1. 场景，点击radio，根据radio的值进行显示某些值[example1](./example1.html)，
   [jsfiddle](http://jsfiddle.net/AAEZP/6/embedded/result,js,html,css/)
