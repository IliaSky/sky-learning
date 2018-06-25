// $(function(){

  var value = function(id) { return document.getElementById(id).value; }
    , bool  = function(x) { return x ? true : false; }
    , log   = function(x) { console.log(x); return x;}
    , json  = JSON.stringify
    , doc   = $(document);


  //                              __VIEWS__
  //==========================================================================

  SG.FLAGS = {};
  SG.VIEWS = {
    // MAIN: '#main > $.HEADER + #container',
    // HEADER: 'header > h1[Welcome to SkyLearning] + @(nav) > nav#top-navi > *a[@@]',
    NAVIGATION: '*a(href:#/@@)[@@]',

    // Common
    _USER: '.user > img(src:/avatar?username=@@) + span[@@]',
    USER: '@(username) > $._USER',
    AUTHOR: '@(author) > $._USER',
    LINK: 'a(href:@url)[@title] + ?(admin) > .actions-menu > button.edit(data-id: @_id)[edit] + button.remove(data-id: @_id)[remove]',
    DATE: 'time(datetime:@created_at)[@created_at|formatDate]',
    FULLSCREEN: 'button#fullscreen[Fullscreen]',
    LINK_LIST: 'ul.link-list > * li > $.LINK',

    // News
    NEWS: 'h2[News] + ?(admin){ button#add-announcement[Add Announcement] } + ul#news > * li > h3[@title] + $.DATE + div[@content]',

    // Lectures
    LECTURES: 'h2[Lectures] + ?(admin){ button#add-lecture[Add Lecture] } + nav#lectures > $.LINK_LIST',

    // Tasks
    TASKS: 'h2[Tasks] + ?(admin){ button#add-task[Add Task] } + nav#tasks > $.LINK_LIST',
    TASK: 'h2[@title] + pre.description[@description] + ?(user) > button#add-solution[Add Solution]',

    // Users
    USERS: 'h2[Users] + ul#users > *li > $.USER',
    TEAM: 'h2[Team] + ul#team > *li > $.USER',
    TEAMVIEWER: 'h2[TeamViewer @id] + $.FULLSCREEN + ?(admin) { form { label(for:meeting-id)[Meeting id] + input#meeting-id(value: @id) + button[Update id] } } + iframe#teamviewer(src:@url)',

    // Forum
    TOPIC_TITLE: 'a(href:#/topics/@_id)[@title]',
    TOPICS: 'h2[Forum] + ?(user){ button#add-topic[Add Topic] } + ul#topics > * li.topic >  $.AUTHOR + $.TOPIC_TITLE + $.DATE',
    TOPIC: 'h2[@title] + @(posts) > ul.posts { * $.POST } + ?(user) > $.ADD_POST',
    POST: 'li.post > .meta {$.AUTHOR} + .content[@content|markdown] + $.DATE',

    // Profile
    PROFILE: 'ul#profile > li[@username] + li.avatar-edit {input(type:file) + canvas} + li { button.changeAvatar[Update Avatar] }',

    TOOL: 'h2[Interactive tool] + $.FULLSCREEN + #tool-container > #tool > fieldset#controls + #images + a#clear[X] + br + #board-container > canvas#board(width:800, height:600) + #temp',

    // Authentication forms
    USERNAME: "label(for:username)[Username] + input#username(type:text,required)",
    PASSWORD: "label(for:password)[Password] + input#password(type:password,required)",
    PASSWORD_AGAIN: "label(for:password-again)[Password Again] + input#password-again(type:password,required)",
    REMEMBER: "label(for:remember)[Remember me] + input#remember(type:checkbox)",
    SUBMIT: "input(type:submit)",

    LOGIN :    "form#login-form    > #error + $.USERNAME + $.PASSWORD + $.REMEMBER + $.SUBMIT",
    REGISTER : "form#register-form > #error + $.USERNAME + $.PASSWORD + $.PASSWORD_AGAIN + $.SUBMIT",
  };


  //                             __HELPERS__
  //==========================================================================

  var scripts = {
    locations: {
      showdown: 'js/showdown/showdown.js',
      ace: 'js/ace/ace.js',
      skyDrawTool: 'js/sky_draw_tool.js'
    },
    waiting: {},
    loaded: {},
    load: function(name, cb) {
      if (scripts.loaded[name]) {
        cb(window[name]);
      } else if (scripts.waiting[name]) {
        scripts.waiting[name].push(cb);
      } else {
        scripts.waiting[name] = [cb];
        $.getScript(scripts.locations[name], function(){
          scripts.loaded[name] = true;
          scripts.waiting[name].forEach(function(cb) {
            cb && cb(window[name]);
          });
          delete scripts.waiting[name];
        });
      }
    }
  };

  SG.BEFORE = {
    TASKS: function (data) {
      data.forEach(function(e){
        e.url = '#/tasks/' + e._id;
      });
      return data;
    },
    TEAMVIEWER: function (data){
      return {id: data.id, url: "https://go.teamviewer.com/v8/flash.aspx?tid=" + data.id}
    }
  };

  SG.FILTERS.formatDate = function (dateString){
    return new Date(dateString).toLocaleString();
  };

  SG.FILTERS.markdown = function (text){
    scripts.load('showdown', function(showdown) {
      var converter = new showdown.Converter();
      SG.FILTERS.markdown = converter.makeHtml.bind(converter);
      onHashChange();
    });
    return text;
  };

  //                            __CONTROLLERS__
  //==========================================================================

  SG.AFTER = {
    TOPIC: function (data){
      $('#add-post-form').submit(function(){
        post('posts/add', { content: value('content'), _id: data._id }, notify);
        return false;
      });
    },
    ADD_TOPIC: function(){
      $('#add-topic-form').submit(function(){
        var topic = { title: value('title'), posts: [{ content: value('content') }] };
        post('topics/add', log(topic), redirect('topics'));
        return false;
      });
    },
    PROFILE: function (data){
      var canvas = $('canvas')[0];
      canvas.width = canvas.height = 128;

      function loadAvatar(src){
          var img = new Image();
          img.onload = function (){
            canvas.getContext('2d').drawImage(img, 0, 0, 128, 128);
            $('button.changeAvatar')[0].dataset.image = canvas.toDataURL('image/jpeg');
          };
          img.src = src;
      }
      loadAvatar('/avatar?username=' + data.username);

      $('input[type=file]').change(function (e){
        var reader = new FileReader();
        reader.onload = function(event){
          loadAvatar(event.target.result);
        };
        reader.readAsDataURL(e.target.files[0]);
      });

      $('button.changeAvatar').click(function(){
        post('changeAvatar', JSON.parse(json(this.dataset)), redirect('profile'));
      })
    },

    LOGIN: function (){
      $('#login-form').submit(onAuthSubmit('login'));
    },

    REGISTER: function (){
      $('#password-again').on('input', function (){
        this.setCustomValidity(value('password') == this.value ? '' : 'Passwords must match');
      });
      $('#register-form').submit(onAuthSubmit('register'));
    },
    ADD_SOLUTION: function () {
      console.log('loading ace');

      scripts.load('ace', function(){
        console.log('ace ready');

        if ($('div#code').size()) return; // prevent double execution

        var value = $('#code').value || 'sasa\nkoko\nabc';
        $('textarea#code').replaceWith('<div id="code" />');
        $('div#code').text(value).css({
          // background: '#222',
          // color: '#ccc',
          width: '600px',
          height: '400px',
          margin: 'auto',
          padding: '10px',
          'box-sizing': 'border-box',
          'text-align': 'left',
          //'border-radius': '10px',
          //'box-shadow': '0 0 10px inset',
        }).attr({contenteditable: 'true'});

        var editor = ace.edit("code");
        ace.config.set('basePath', '/js/ace');

        editor.setTheme("ace/theme/solarized_dark");
        editor.session.setMode("ace/mode/html");

        $.getScript('/js/ace/ext-emmet.js', function() {
          $.getScript('/js/emmet.js', function() {
            ace.require("ace/ext/emmet");

            editor.setOptions({
                enableEmmet: true,
            });
          })
        })
        console.log('ace done');
      });
    },
    TEAMVIEWER: function () {
      var hasFlash = [].find.call(navigator.plugins, function(e){
        return e.name.match(/flash/i);
      });
      if (!hasFlash){
        $('iframe#teamviewer').replaceWith('<div style="position:relative; width:120px; height:60px; margin:10px auto;"><a href="http://www.teamviewer.com/link/?url=753663&id=326745875" style="text-decoration:none;"><img src="http://www.teamviewer.com/link/?url=742306&id=326745875" alt="TeamViewer for your online meeting" title="TeamViewer for your online meeting" border="0" width="120" height="60" /><span style="position:absolute; top:17.5px; left:45px; display:block; cursor:pointer; color:White; font-family:Arial; font-size:11px; line-height:1.2em; font-weight:bold; text-align:center; width:70px;">Download QuickJoin</span></a></div>');
        $('#fullscreen').hide();
      }
      $('form').submit(function(){
        post('meetings/edit', {_id: "000000000000000000000000", id: value('meeting-id')}, function(){
          $('#teamviewer')[0].src = $('#teamviewer')[0].src.replace(/=.*?$/, '=' + value('meeting-id'));
        })
        return false;
      })
      $('#fullscreen').click(function(){
        fullscreen($('#teamviewer')[0]);
      })
    },
    TOOL: function () {
      scripts.load('skyDrawTool', function(tool){
        tool.init();
      });
    }
  };

  doc.on('click', '.edit', function(){ // todo: don't use current hash
    location.hash = '/' + location.hash.split('/')[1] + '/' + this.dataset.id + '/edit';
  });
  doc.on('click', '.remove', function(){
    post(location.hash.split('/')[1] + '/remove', {_id: this.dataset.id}, onHashChange);
  });

  //                                 __UTILS__
  //==========================================================================

  function get(url, data, callback) {
    $.ajax({ url: url, type: "GET", timeout: 1000, dataType: "json", success: callback, data: data }).done(function(x){log(x);});
  }
  function post(url, data, callback) {
    $.ajax({ url: url, type: "POST", timeout: 1000, dataType: "json", success: callback, data: data });
  }

  function setFlags(user, remember, redirectTo){
    SG.FLAGS = {
       guest: !user.username,
       user: !!user.username,
       admin: !!user.admin
    };

    localStorage['user'] = remember ? JSON.stringify(user) : '{}';
    location.hash = redirectTo || '/';
    onHashChange(); // there should be a better way?
  }
  function notify(data){
    $('#status').html(log(data) ? 'Done' : 'Error');
  }

  function authenticate(url, user, remember, noRedirect){
    // console.log('request auth', JSON.stringify(user));
    post(url, user, function(_user){
      // console.log('response auth', JSON.stringify(_user));
      if (_user && _user.username) {
        setFlags(_user, remember, noRedirect);
      } else {
        log('auth failed');
        $('#error').text('Authentication failed.');
      }
    });
  }
  function back(){
    window.history.back();
  }
  function redirect(page){
    return function(){
      location.hash = '/' + page;
    };
  }

  function merge() {
    var result = {};
    for (var i = 0; i < arguments.length; i++)
      for (var key in arguments[i])
        result[key] = arguments[i][key];
    return result;
  }


  function fullscreen(el){
    var AXO, requestMethod = el.requestFullScreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullScreen;

    if (requestMethod)
        requestMethod.call(el);
    else if (window.ActiveXObject && (AXO = new ActiveXObject("WScript.Shell")))
        if (AXO !== null)
            AXO.SendKeys("{F11}");
  }

  //                                __FORMS__
  //==========================================================================

  function onAuthSubmit(url){
    return function (){
      var user = {username: value('username'), password: value('password')};
      authenticate(url, user, url == 'register' ? '' : value('remember'));
      return false;
    }
  }
  function formToObject(form){ // will not work well with radio / select[multiple]
    var elements = $(form).find('input:not([type="submit"]), textarea');
    var result = {};
    for (var i = 0, n = elements.length; i < n; i++)
      result[elements[i].id] = elements[i].value;
    return log(result);
  }

  var schema = { // maybe get the schema from the server?
    announcement: ['title', 'content'],
    lecture:      ['title', 'url', 'presentation_date'],
    task:         ['title', 'description', 'available_until'],
    solution:     ['code'],
    topic:        ['title', 'content'],
    post:         ['content']
  };

  function generateFormView(type){ // better alternatives? // need to upgrade SG for k: v syntax
    var pattern = schema[type].map(function(el){
      var tag = ['code', 'content', 'description'].indexOf(el) != -1 ? 'textarea' : 'input';
      var type = el.match(/date|until/) ? ',type:date': '';
      return 'label(for:'+ el +')['+ el.replace('_', ' ') +']+'+ tag +'#'+ el +'(name:'+ el + type +')[@'+ el +']';
    }).join('+');
    return 'h2[Add '+ type + '] + form#add-' + type + '-form > ' + pattern + '+ $.SUBMIT';
  }

  var emptyForms = {};
  for (var type in schema){
    SG.VIEWS['ADD_' + type.toUpperCase()] = generateFormView(type);

    emptyForms[type] = {};
    for (var i = 0, n = schema[type].length; i < n; i++)
      emptyForms[type][schema[type][i]] = '';
  }

  doc.on('click', 'button[id^="add-"]', function(){
    location.hash = '/add_' + this.id.slice(4);
  });

  doc.on('submit', 'form[id^="add-"]:not(#add-topic-form):not(#add-post-form)', function(){
    var type = this.id.slice(4,-5);
    post(type + 's/add', formToObject(this), back);
    return false;
    // $('#container').html(generateForm(type));
  });
  doc.on('webkitfullscreenchange mozfullscreenchange fullscreenchange', function(e) {
    var state = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen;
    $('#fullscreen').length && $('#fullscreen')[state ? 'hide' : 'show']();
  })


  //                               __MAIN__
  //==========================================================================

  function load(pattern) {
    pattern = pattern.toUpperCase();

    return function (data){
      if (SG.BEFORE.hasOwnProperty(pattern))
        data = SG.BEFORE[pattern](data);

      $('#container').html(SG('$.' + pattern, data));

      if (SG.AFTER.hasOwnProperty(pattern))
        SG.AFTER[pattern](data);
    };
  }

  var user_nav  = ['profile', 'logout'];
  var guest_nav = ['register', 'login'];

  function onHashChange(){
    var m, url = location.hash.slice(2) || 'news';
    $('#top-navi').html(SG('$.NAVIGATION', (SG.FLAGS.user ? user_nav : guest_nav)));

    if (url == 'logout')
      return get('logout', null, function(){ setFlags({}); });

    if (m = url.match(/(topic|task|lecture)s\/([^\/]*)?(?:\/(edit))?/))
      return get(m[1] + 's/one', {_id: m[2]}, load((m[3] ? 'add_': '') + m[1]));

    if (/news|lectures|tasks|forum|topics|users|team|profile/.test(url))
      get(url, null, load(url));
    else                          // maybe there should be a filter and 404 here
      load(url)((m = url.match(/add_(.*)/)) ? emptyForms[m[1]] : {});
  }
  $(window).hashchange(onHashChange).hashchange();

  if (localStorage.user && localStorage.user != '{}') // todo: fix when there is no LS
    authenticate('login', JSON.parse(localStorage.user), true, location.hash)

// });
