KISSY.add(function(S, Bidi){

  function formattedPrice(price){
    return price ? "$" + price.toFixed(2) : "None";
  }   

  Bidi.pipe('formattedPrice', formattedPrice);

  function Seat(name, meal){
    this.name = name;
    this.meal = meal;
  }

  Seat.prototype.price = function(){
    var parent = this.parent;
    var meal = this.meal;
    var m = parent.get('meals')[meal];
    return m.price;
  };

  Seat.prototype.remove = function(){
    this.parent.remove(this);
  };

  var lists = Bidi.xbind('list', {
    seats: [
      new Seat('Steve', 0),
      new Seat('Hanwen', 1)
    ],
    meals: [
      { mealName: "Standard (sandwich)", price: 0, value: 0 },
      { mealName: "Premium (lobster)", price: 34.95, value: 1 },
      { mealName: "Ultimate (whole zebra)", price: 290, value: 2 }
    ]
  }, {
    totalSurcharge: function(){

      var seats = this.get('seats');
      var price = 0;

      S.each(seats, function(seat){
        price += this.get('price', seat);
      }, this);

      return price;
    },
    addSeat: function(){
      var seat = new Seat('Haha', 2);
      this.add(seat, 'seats');
    }
  });

  return lists;
}, {
  requires: ['../index']
})
