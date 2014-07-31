KISSY.add(function(){

  describe('Lists', function(){

    it('text support seats.length', function(){
      var lists = window.Bidi.lists
      var model = lists.model
      var seat = lists.el.all('h2').all('span')
      expect(model.get('seats').length).to.be( +seat.text() )
    })

    it('list add item support', function() {
      var lists = window.Bidi.lists
      var model = lists.model
      var tbody = lists.el.all('tbody')
      var len = model.get('seats.length')
      var seat = lists.el.all('h2').all('span')

      expect(tbody.all('tr').length).to.be(len)

      //add an seat
      model.call('addSeat')
      expect(tbody.all('tr').length).to.be(len + 1)
      expect( +seat.text() ).to.be(len + 1)

      var addBtn = lists.el.all('button')
      addBtn.fire('click')
      expect(tbody.all('tr').length).to.be(len + 2)
      expect( +seat.text() ).to.be(len + 2)
    })

    it('list remove item support', function() {
      var lists = window.Bidi.lists
      var model = lists.model
      var tbody = lists.el.all('tbody')
      var items = tbody.all('tr')
      var len = model.get('seats.length')
      var seat = lists.el.all('h2').all('span')

      items.item(0).all('.btn-danger').fire('click')
      expect( +seat.text() ).to.be(len - 1)
      expect( tbody.all('tr').length ).to.be(len - 1)
    })

    it('list item change and pipe support for text bind', function() {
      var lists = window.Bidi.lists
      var model = lists.model
      var tbody = lists.el.all('tbody')
      var $item = tbody.all('tr').item(0)
      var seat = model.get('seats')[0]

      expect( +$item.all('select').val() ).to.be(seat.meal)

      model.set('meal', 2, seat)
      expect( +$item.all('select').val() ).to.be(2)
      var price = model.call('price', seat)
      expect( $item.all('.price').text() ).to.be( '$' + price.toFixed(2) )

      model.set('meal', 0, seat)
      expect( +$item.all('select').val() ).to.be(0)
      expect( $item.all('.price').text() ).to.be('None')
    })

    it('logic compare >= support', function() {
      var lists = window.Bidi.lists
      var model = lists.model
      var len = model.get('seats.length')

      while(len < 6){
        model.get('addSeat')
        len += 1
      }

      expect(lists.el.all('button').attr('disabled')).to.be('disabled')
      expect(model.get('seats.length')).to.be(len)
    })

  })
})
