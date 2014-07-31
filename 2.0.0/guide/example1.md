## 场景1

radio的变动，改变相关的dom。

<div class="container bidi-viewer" data-view="form-1">

  <script type="text/xtemplte">
    <div {{watch "radio: reasons.defaultValue"}}>
      {{@each reasons.values}}
        <label class="radio-inline">
          <input type="radio" name="hello" value="{{value}}"/>{{text}}
        </label>
      {{/each}}
    </div>
    <p {{watch "class:reasons.$item.judge:hide"}}>I have reasons.$item.judge</p>
  </script>

</div>

### 绑定过程

使用了两个绑定，radio和

```html
<div class="container bidi-viewer" data-view="form-1">

  <script type="text/xtemplte">
    <div {{watch "radio: reasons.defaultValue"}}>
      {{@each reasons.values}}
        <label class="radio-inline">
          <input type="radio" name="hello" value="{{value}}"/>{{text}}
        </label>
      {{/each}}
    </div>
    <p {{watch "class:reasons.$item.judge:hide"}}>I have reasons.$item.judge</p>
  </script>

</div>
```

```js
  Bidi.xbind('form', {

    reasons: {
      defaultValue: null,
      name: "reasons",
      values: [
        { value: 11, text: '尺寸、尺码不符', judge: true, title: "desc" },
        { value: 12, text: '拼接、走线不齐' },
        { value: 21, text: '材质不符', judge: true },
        { value: 22, text: '严重缩水、褪色、起球、掉毛' },
        { value: 31, text: '收到商品时有破损' },
        { value: 32, text: '拼接、走线不齐', judge: true },
        { value: 33, text: '开线、走丝', judge: true },
        { value: 44, text: '有污渍' },
        { value: 45, text: '配件破损或不符' }
      ]
    }

  });

  Bidi.init();
```


<script src="http://g.tbcdn.cn/kissy/k/1.4.1/seed.js" charset="utf-8"></script>
<script type="text/javascript">
  var S = KISSY;
  S.Config.debug = true;
  if (S.Config.debug) {
    var srcPath = "../../../";
    S.config({
      packages:[
        {
          name: "kg",
          path: srcPath,
          charset: "utf-8",
          ignorePackageNameInUri: true
        }
      ]
    });
  }

  S.use('kg/bidi/1.2/index', function(S, Bidi){

    Bidi.xbind('form-1', {
      reasons: {
        defaultValue: null,
        name: "reasons",
        values: [
          { value: 11, text: '尺寸、尺码不符', judge: true, title: "desc" },
          { value: 12, text: '拼接、走线不齐' },
          { value: 21, text: '材质不符', judge: true },
          { value: 22, text: '严重缩水、褪色、起球、掉毛' },
          { value: 31, text: '收到商品时有破损' },
          { value: 32, text: '拼接、走线不齐', judge: true },
          { value: 33, text: '开线、走丝', judge: true },
          { value: 44, text: '有污渍' },
          { value: 45, text: '配件破损或不符' }
        ]
      }
    });

    Bidi.init();

  });
</script>
