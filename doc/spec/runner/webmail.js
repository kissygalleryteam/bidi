KISSY.add(function(){

  describe('Web mail', function(){

    it('Mail folder nav should select the Index', function(){
      var webmail = window.Bidi.webmail
      var model = webmail.model
      var folders = webmail.el.all('li', '.nav')
      expect(folders.length).to.be(model.get('folders.length'))
      expect(folders.item(0).hasClass('active')).to.be(true)
    })

    it('folder click trigger form lists change', function(done){
      var webmail = window.Bidi.webmail
      var model = webmail.model
      var folders = webmail.el.all('li', '.nav')
      folders.item(1).fire('click')
      expect(folders.item(0).hasClass('active')).to.be(false)
      expect(folders.item(1).hasClass('active')).to.be(true)

      var S = KISSY
      //等待100ms
      S.later(function(){

        S.io.get('./webmail/Archive.htm').then(function(argv){
          var mails = eval(argv[0]);
          var mailsEl = webmail.el.all('tbody').all('tr')

          expect(model.get('mails').length).to.be(mails.length)
          expect(mailsEl.length).to.be(mails.length)

          expect(model.get('mails')[0].from).to.be(mails[0].from)
          expect(mailsEl.all('td').text()).to.be(mails[0].from)
          done()
        })

      }, 100)
    })

    it('click mail tr show mail content', function(done){
      var webmail = window.Bidi.webmail
      var model = webmail.model
      var mailsEl = webmail.el.all('tbody').all('tr')

      var table = webmail.el.all('table')
      var mailEl = webmail.el.all('.viewMail')

      expect(table.hasClass('hide')).to.be(false)
      expect(mailEl.hasClass('hide')).to.be(true)

      var from = mailsEl.all('td').text()
      mailsEl.item(0).fire('click')

      S.later(function(){
        mailEl = webmail.el.all('.viewMail')
        table = webmail.el.all('table')

        expect(mailEl.hasClass('hide')).to.be(false)
        expect(mailEl.all('span').text()).to.be(from)
        expect(table.hasClass('hide')).to.be(true)
        done()
      }, 100)
    })

  })

})
