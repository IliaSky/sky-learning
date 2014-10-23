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
    LINK: 'a(href:@url)[@title] + ?(admin) > button.edit(data-id: @_id)[edit] + button.remove(data-id: @_id)[remove]',
    DATE: 'time(datetime:@created_at)[@created_at|formatDate]',
    FULLSCREEN: 'button#fullscreen[Fullscreen]',

    // News
    NEWS: 'h2[News] + ?(admin){ button#add-announcement[Add Announcement] } + ul#news > * li > h3[@title] + $.DATE + div[@content]',

    // Lectures
    LECTURES: 'h2[Lectures] + ?(admin){ button#add-lecture[Add Lecture] } + nav#lectures > * $.LINK',

    // Tasks
    TASKS: 'h2[Tasks] + ?(admin){ button#add-task[Add Task] } + nav#tasks > * $.LINK',
    TASK: 'h2[@title] + pre.description[@description] + ?(user) > button#add-solution[Add Solution]',

    // Users
    USERS: 'h2[Users] + ul#users > *li > $.USER',
    TEAM: 'h2[Team] + ul#team > *li > $.USER',
    TEAMVIEWER: 'h2[TeamViewer] + $.FULLSCREEN + ?(admin) { form { label(for:meeting-id)[Meeting id] + input#meeting-id(value: @id) + button[Update id] } } + iframe#teamviewer(src:@url)',

    // Forum
    TOPIC_TITLE: 'a(href:#/topics/@_id)[@title]',
    TOPICS: 'h2[Forum] + ?(user){ button#add-topic[Add Topic] } + ul#topics > * li.topic >  $.AUTHOR + $.TOPIC_TITLE + $.DATE',
    TOPIC: 'h2[@title] + @(posts) > ul.posts { * $.POST } + ?(user) > $.ADD_POST',
    POST: 'li.post > $.AUTHOR + .content[@content] + $.DATE',

    // Profile
    PROFILE: 'ul#profile > li[@username] + li.avatar-edit {input(type:file) + canvas} + li { button.changeAvatar[Update Avatar] }',

    TOOL: 'h2[Interactive tool] + $.FULLSCREEN + #tool-container > #tool > fieldset#controls + #images + a#clear[X] + br + #board-container > canvas#board(width:800, height:600) + #temp',

    // Authentication forms
    USERNAME: "label(for:username)[Username] + input#username(type:text,required)",
    PASSWORD: "label(for:password)[Password] + input#password(type:password,required)",
    PASSWORD_AGAIN: "label(for:password-again)[Password Again] + input#password-again(type:password,required)",
    REMEMBER: "label(for:remember)[Remember me] + input#remember(type:checkbox)",
    SUBMIT: "input(type:submit)",

    LOGIN :    "form#login-form    > $.USERNAME + $.PASSWORD + $.REMEMBER + $.SUBMIT",
    REGISTER : "form#register-form > $.USERNAME + $.PASSWORD + $.PASSWORD_AGAIN + $.SUBMIT",
  };


  //                             __HELPERS__
  //==========================================================================

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
    SOLUTION: function () {

    },
    TEAMVIEWER: function () {
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
      var board = $('#board')
        , container = $('#board-container')
        , controls = $('#controls')
        , temp = $('#temp')
        , ctx = board[0].getContext('2d');

      $('#fullscreen').click(function(){
        fullscreen($('#container').css('background', ' url(/img/bg.jpg)')[0]);
      })

      $('#clear').click(function(e){
        return temp.html(''), ctx.clearRect(0,0,board.width(),board.height()), false;
      })
      function draw(ctx, type, data){
        ctx.beginPath();
        ctx.fillStyle = or(data.fill, T.settings.color);
        ctx.lineWidth = or(data.width, 16);
        ctx.strokeStyle = or(data.stroke, T.settings.color);
        var drawShape = {
          circle: function (data) {
            ctx.arc(data.x, data.y, or(data.radius, 0), 0, 2 * Math.PI);
          },
          rectangle: function (data) {
            var width = data.end.x - data.start.x
              , height = data.end.y - data.start.y;
            ctx.rect(data.start.x, data.start.y, width, height);
          },
          image: function (data) {
            var start = data.start, end = data.end, image = or(data.image, T.settings.image);
            ctx.save();
            ctx.translate((start.x + end.x) / 2, (start.y + end.y) / 2);
            scale = Math.min(Math.abs(start.x - end.x)/ image.width, Math.abs(start.y - end.y) / image.height)
            ctx.scale(scale, scale);
            ctx.drawImage(image, -(image.width/2), -(image.height/2));
            ctx.restore();
          },
          line: function (data) {
            ctx.moveTo(data.start.x, data.start.y);
            ctx.lineTo(data.end.x, data.end.y);
          },
          text: function (data) {
            ctx.font = or(data.font, T.settings.font);
            ctx.fillStyle = or(data.color, T.settings.color);
            for(var words = data.text.split(' '), line = '', n = 0; n < words.length; n++) {
              var testLine = line + words[n] + ' ';
              var testWidth = ctx.measureText(testLine).width;
              if (testWidth > data.width && n > 0)
                ctx.fillText(line, data.x, data.y), line = words[n] + ' ', data.y += 15;
              else
                line = testLine;
            }
            ctx.fillText(line, data.x, data.y + 15);
          }
        }
        drawShape[type](data);
        // ctx.fill();
        ctx.stroke();
      };
      var T = {
        modes: {
          brush: {
            start: function (e) {
              log('brush start');
              draw(ctx, 'circle', merge(T.coords.current, {radius: 2, width: 3}));
              temp.html('');
              // draw(ctx, 'circle', T.coords.start);
            },
            move: function () {
              draw(ctx, 'line', {start: T.coords.previous, end: T.coords.current, width: 8});
              draw(ctx, 'circle', merge(T.coords.current, {radius: 2, width: 3}));
              log('brush move');
            },
            end: function () {
              // draw(ctx, 'line', log({start: T.coords.current, end: T.coords.end}));
              // draw(ctx, 'circle', T.coords.current);
              log('brush end');
            },
          },
          line: {
            start: function () {
              temp.html(SG('canvas(width:0, height:0)'))
                .find('canvas').css({top: T.coords.start.y, left: T.coords.start.x});
              log('line start');
            },
            move: function () {
              var width = T.coords.current.x - T.coords.start.x
                , height = T.coords.current.y - T.coords.start.y
                , tempCanvas = temp.find('canvas');
              tempCanvas
                .attr({width: Math.abs(width), height: Math.abs(height)})
                .css({'margin-left': Math.min(0, width), 'margin-top': Math.min(0, height)})
              var data = {
                start: {x: 0, y: (width * height > 0 ? 0 : Math.abs(height))},
                end: {x: Math.abs(width), y: (width * height > 0 ? Math.abs(height) : 0)}
              };
              draw(tempCanvas[0].getContext('2d'), 'line', merge(data, {width: 5, stroke: 'lime'}));
              log('line move');
            },
            end: function () {
              log('line end');
              draw(ctx, 'line', {start: T.coords.start, end: T.coords.current, width: 5});
              temp.html('');
            },
          },
          rectangle: {
            start: function () {
              // temp.html(SG('canvas(width:0, height:0)')).find('canvas').css({
              $(SG('canvas(width:0, height:0)')).appendTo(temp).css({
                top: T.coords.start.y,
                left: T.coords.start.x,
                background: 'lime'
              });
              log('rectangle start');
            },
            move: function () {
              var width = T.coords.current.x - T.coords.start.x
                , height = T.coords.current.y - T.coords.start.y;
              temp.find('canvas').css({
                'width': Math.abs(width),
                'height': Math.abs(height),
                'margin-left': Math.min(0, width),
                'margin-top': Math.min(0, height)
              })
              log('rectangle move');
            },
            end: function () {
              draw(ctx, 'rectangle', {start: T.coords.start, end: T.coords.current, width: 5});
              temp.html('');
              log('rectangle end');
            },
          },
          image: {
            start: function () {
              $(SG('canvas(width:0, height:0)')).appendTo(temp).css({
                top: T.coords.start.y,
                left: T.coords.start.x
              });
              log('image start');
            },
            move: function () {
              var width = T.coords.current.x - T.coords.start.x
                , height = T.coords.current.y - T.coords.start.y
                , tempCanvas = temp.find('canvas')
                , min = Math.min.bind(Math)
                , abs = Math.abs.bind(Math);
              tempCanvas
                .attr({width: abs(width), height: abs(height)})
                .css({'margin-left': min(0, width), 'margin-top': min(0, height)})

              draw(tempCanvas[0].getContext('2d'), 'image', {start: {x: 0, y: 0}, end: {x: abs(width), y: abs(height)}});
              log('image move');
            },
            end: function () {
              draw(ctx, 'image', {start: T.coords.start, end: T.coords.current});
              temp.html('');
              log('image end');
            },
          },
          text: {
            start: function () {
              log('text start');
              function drawExistingText () {
                var textarea = temp.find('textarea');
                if (textarea.length){
                  var position = textarea.offset();
                  board.css('position', 'absolute')
                  draw(ctx, 'text', {
                    x: position.left - temp.offset().left,
                    y: position.top - temp.offset().top,
                    width: textarea.width(),
                    text: textarea.val()
                  });
                  board.css('position', 'relative')
                  temp.html('');
                }
              }
              drawExistingText();

              temp.html(SG('textarea(width:0, height:0)')).children().css({
                top: T.coords.start.y,
                left: T.coords.start.x,
              }).on('keyup', function (e){
                if (e.keyCode == 13) // Enter
                  drawExistingText();
                if (e.keyCode == 27) // Escape
                  temp.html('');
              });
            },
            move: function () {
              log('text move');
              var width = T.coords.current.x - T.coords.start.x
                , height = T.coords.current.y - T.coords.start.y;
              temp.find('textarea').css({
                'width': Math.abs(width),
                'height': Math.abs(height),
                'margin-left': Math.min(0, width),
                'margin-top': Math.min(0, height)
              })
            },
            end: function () {
              log('text end');
              temp.find('textarea').focus();
            },
          }
        },
        coords: {
        },
        settings: {
          color: '#000',
          font: '15px Arial'
        }
      };

      T.init = function () {

        controls.html(SG(Object.keys(T.modes).map(function(e){
          return 'button#' + e + '[' + e + ']';
        }).join(' + '))).append($(SG('*label > [@@] + input.color(id: @@Color, type:color)', ['primary', 'secondary', 'background'])));

        var colors = $('.color').change(function(){
          T.settings[this.id] = this.value;
        })//.val('#445588').change().eq(1).val('#883344').change()
        colors[0].value = '#6699cc', colors[1].value = '#cc6699', colors[2].value = '#111111'
        colors.eq(2).change(function(){
          board.css('background', this.value)
        })
        colors.change()

        function getCoords(e){
          var offset = $(/*e.target*/'#board').offset();
          return {x: e.pageX - offset.left, y: e.pageY - offset.top}
        }
        board.on('contextmenu', function (e){ return e.preventDefault(), false; });

        controls.find('button').click(function(){
          T.mode = T.modes[this.id];
          $('button.selected').removeClass('selected');
          $(this).addClass('selected')
          function mouseDown (e) {
            T.coords.start = T.coords.current = getCoords(e);
            T.settings.color = T.settings[(e.which == 1 ? 'primary' : 'secondary') + 'Color'];

            T.mode.start && T.mode.start();

            container.on('mousemove', function(e){
                T.coords.previous = T.coords.current, T.coords.current = getCoords(e);
                T.mode.move && T.mode.move(e);
            }).off('mousedown', mouseDown)
              .one('mouseup', function(){
                container.off('mousemove mouseup');
                T.coords.end = getCoords(e);
                T.mode.end && T.mode.end(e);
                container.on('mousedown', mouseDown);
            });
          }
          container.off().on('mousedown', mouseDown);
        }).first().click();
        $('#image').click(function(){
          if (!$('#images img').length){
            $('#images')
              .html(SG('*img(src:img/@@)', ['actor.png', 'server.png', 'db.png', 'web.png']))
              .hide()
              .find('img').click(function(){
                T.settings.image = this;
                $('#images img').removeClass('selected');
                $(this).addClass('selected');
                $('#images').slideUp();
              }).eq(0).click();
          }
          $('#images').slideDown();
        })
      };
      T.init();
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
    post(url, user, function(_user){
      user ? setFlags(_user, remember, noRedirect) : log('auth failed');
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

  function or() {
    for (var i = 0; i < arguments.length && arguments[i] === undefined; i++);
    return arguments[i];
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
      authenticate(url, user, value('remember'));
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
  }

  function generateFormView(type){ // better alternatives? // need to upgrade SG for k: v syntax
    var pattern = schema[type].map(function(el){
      var tag = ['code', 'content', 'description'].indexOf(el) != -1 ? 'textarea' : 'input';
      return 'label(for:'+ el +')['+ el +']+'+ tag +'#'+ el +'(name:'+ el +')[@'+ el +']';
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
