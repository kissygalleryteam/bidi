KISSY.add(function(S, Bidi){

  //Bidi.active(['text', 'click', 'class']);

  var form = Bidi.xbind('form', {

    problem: {
      defaultValue: 2,
      values: [
        {value: 1, text: '大小尺寸不符合', reasons: [11, 12]},
        {value: 2, text: '材料面料不符合', reasons: [21]},
        {value: 3, text: '工艺手艺问题', reasons: [31, 32, 33]},
        {value: 4, text: '颜色、款式、图案描述不符', reasons: [44, 45]},
        {value: 5, text: '颜色、款式、图案描述不符'}
      ]
    },

    reasons: {
      defaultValue: null,
      name: "reasons",
      values: [
        {value: 11, text: '尺寸、尺码不符', jude: true, title: "desc", subs: [11, 12]},
        {value: 12, text: '拼接、走线不齐'},
        {value: 21, text: '材质不符', jude: true, subs: [21, 22, 12]},
        {value: 22, text: '严重缩水、褪色、起球、掉毛'},
        {value: 31, text: '收到商品时有破损'},
        {value: 32, text: '拼接、走线不齐', jude: true},
        {value: 33, text: '开线、走丝', jude: true},
        {value: 44, text: '有污渍'},
        {value: 45, text: '配件破损或不符'}
      ]
    },

    subs: {
      defaultValue: null,
      values: [
        {value: 11, text: '尺寸、尺码不符', jude: true, title: "desc"},
        {value: 12, text: '拼接、走线不齐'},
        {value: 21, text: '材质不符', jude: true},
        {value: 22, text: '严重缩水、褪色、起球、掉毛'},
      ]
    },

    logistics: {
      defaultValue: null,
      values: [
        {value: 1, text: 'EMS'},
        {value: 2, text: '申通E物流'},
        {value: 3, text: '圆通速递'},
        {value: 4, text: '宅急送'}
      ]
    },

    jude: {
      defaultValue: null,
      values: [
        {value: 1, text: '31名大众评审'},
        {value: 2, text: '淘宝小二评审'}
      ]
    },

    phone: 1111111111,

    feedback: {
      value: null,
      values: [
        {value: 1, text: '卖家已签收未处理'},
        {value: 2, text: '卖家拒绝签收'},
        {value: 3, text: '卖家反馈未收到货'},
        {value: 4, text: '退货地址不详细'}
      ]
    },

    editable: function(){
      var edit = !this.get('isEdit');
      this.set('isEdit', edit);
    },

    refundMoney: {

      max: 155,
      postage: 10

    }
  }, {

    realMax:  function(){

      var isSevenDayReason = Number(this.get('problem.defaultValue')) == 3;
      var max = this.get('refundMoney.max');

      if(!isSevenDayReason){
        return max;
      } else {
        var postage = this.get('refundMoney.postage');
        return max - postage;
      }
    },

    submit: function(){
      alert('submit it');
    }

  });

  return form;

}, {
  requires: ['../index']
});
