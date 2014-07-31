KISSY.add(function(S, Bidi){

  function formattedPrice(price){
    return price ? "$" + price.toFixed(2) : "None";
  }   

  Bidi.pipe('formattedPrice', formattedPrice);

  var lists = Bidi.xbind('list', {
    seats: [
      { name: 'Steve', meal: 0 },
      { name: 'Hanwen', meal: 1 }
    ],
    meals: [
      { mealName: "Standard (sandwich)", price: 0, value: 0 },
      { mealName: "Premium (lobster)", price: 34.95, value: 1 },
      { mealName: "Ultimate (whole zebra)", price: 290, value: 2 }
    ]
  }, {

    price: function(seat){
      var meal = seat.meal;
      var meals = this.get('meals');
      return meals[meal].price;
    },

    remove: function(seat){
      this.remove(seat);
    },

    totalSurcharge: function(){

      var seats = this.get('seats');
      var price = 0;

      S.each(seats, function(seat){
        price += this.call('price', seat);
      }, this);

      return price;
    },

    addSeat: function(){
      this.add( { name: "Eward", meal: 1 }, 'seats');
    }
  });

  return lists;
}, {
  requires: ['../index']
})
