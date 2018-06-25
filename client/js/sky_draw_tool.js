(function () {
  var board, container, controls, temp, ctx;

  //[].find.call(arguments, function(e) { return e !== undefined; });
  function or() {
    for (var i = 0; i < arguments.length && arguments[i] === undefined; i++);
    return arguments[i];
  }

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
    board = $('#board');
    container = $('#board-container');
    controls = $('#controls');
    temp = $('#temp');
    ctx = board[0].getContext('2d');

    $('#fullscreen').click(function(){
      fullscreen($('#container').css('background', ' url(/img/bg.jpg)')[0]);
    });

    $('#clear').click(function(e){
      return temp.html(''), ctx.clearRect(0,0,board.width(),board.height()), false;
    });

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

  window.skyDrawTool = T;
})();