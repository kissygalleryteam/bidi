
KISSY.add(function(S, Bidi){

  function Folder(text){
    this.text = text;
  }

  S.augment(Folder, {

    goFold: function(folder){
      var text = this.get('text' ,folder);
      this.set('folder', text);
      showMails(text);
    },

    isSeleted: function(folder){
      var text = this.get('text' ,folder);
      return text == this.get('folder');
    }

  });

  var view = Bidi.xbind('webmail', {
    folders: [
      new Folder('Index'),
      new Folder('Archive'),
      new Folder('Sent'),
      new Folder('Spam')
    ],
    mails: [],
    choosedMail: false,
    folder: "Index"
  }, {
    goToMail: function(mail){
      var mail = this.get(null, mail)
      S.io.get('./webmail/mail.html?id=' + mail.id).then(function(argv){
        var mail = eval('(' + argv[0] + ')')
        model.set('choosedMail', mail)
        model.set('mails', [])
      });
    }
  }); 

  var model = view.model;

  Bidi.init();

  showMails('Index');

  function showMails(folder){
    S.io.get('./webmail/' + folder + '.htm').then(function(argv){
      var mails = eval(argv[0]);
      model.set('mails', mails);
      model.set('choosedMail', false)
    });
  }

}, {
  requires: ['../index']
})
