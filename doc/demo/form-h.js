KISSY.add(function(S, Bidi){

  //Bidi.active(['text', 'click', 'class']);

  var form = Bidi.xbind('form-h', {

    goodsStatus: {
      defaultValue: "1",
      values: [
        {
          reasons: [ 187, 189, 191, 6, 194, 196, 197 ],
          text: "未收到货",
          value: "1"
        },
        {
          reasons: [ 188, 190, 192, 193, 195, 11, 18, 199 ],
          text: "已收到货",
          value: 2
        }
      ]
    },

    reasons: {
      defaultValue: 187,
      values: [
        { text: "空包裹/少货", value: 187, descriptions: [11, 12] },
        { text: "快递问题", value: 189, descriptions: [21, 22] },
        { text: "卖家发错货", value: 191, descriptions: [31, 32] },
        { text: "未按约定时间发货", value: 6, descriptions: [31, 32, 33] },
        { text: "虚假发货", value: 194, descriptions: [44, 45] },
        { text: "多拍/拍错/不想要", value: 196 },
        { text: "其他", value: 197 },
        { text: "尺寸不符", value: 188, descriptions: [44, 45] },
        { text: "材质面料不符", value: 190 },
        { text: "工艺/手艺问题", value: 192 , descriptions: [44, 45]},
        { text: "颜色、款式、吊牌等描述不符", value: 193, descriptions: [44, 45] },
        { text: "发货问题", value: 195, descriptions: [31]  },
        { text: "效果不好/不喜欢", value: 11, descriptions: [31, 32, 33]  },
        { text: "认为是假货", value: 18 },
        { text: "其他", value: 199 }
      ]
    },

    descriptions: {
      values: [
        { value: 11, text: '尺寸、尺码不符', jude: true, title: "desc", subs: [11, 12] },
        { value: 12, text: '拼接、走线不齐' },
        { value: 21, text: '材质不符', jude: true, subs: [21, 22, 12] },
        { value: 22, text: '严重缩水、褪色、起球、掉毛' },
        { value: 31, text: '收到商品时有破损' },
        { value: 32, text: '拼接、走线不齐', jude: true },
        { value: 33, text: '开线、走丝', jude: true },
        { value: 44, text: '有污渍' },
        { value: 45, text: '配件破损或不符' }
      ]
    }

  });

  return form;

}, {
  requires: ['../index']
});
