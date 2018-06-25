  // ========================= HELPER FUNCTIONS =========================

  function $(id) { return document.getElementById(id); }
  function escapeHTML(string) {
    var pre = document.createElement('pre');
    pre.appendChild(document.createTextNode(string));
    return pre.innerHTML;
  }
  function commentsToHTML(comments, common) {
      var text = escapeHTML(comments).replace(/''/g, "'").replace(/@(\w+)/g, function(_, key) {
        return common[key] || (console.warn(key));
      });

      var simpleComments = ('<li>' + text.replace(/([!\.?]) /g, '$1</li><li>') + '</li>');

      var i = 0;
      var nestedComments = simpleComments.replace(/[A-Z][A-Z]+: /g, function (label) {
        return (i++ ? '</ul></li><li>' : '') + '<span class="label">' + label + '</span><ul><li>'
      }) + (i ? '</ul>' : '');

      return nestedComments.replace(/\d{5}/g, '<a href="#$&">$&</a>');
  }
  // ========================= EXTRA =========================
  var wrapper = document.body;
  wrapper.setAttribute('style', 'transition: all 0.2s ease-in-out;');

  $('toggle-dark-style').onclick = function() {
    if (localStorage)
      localStorage.dark = localStorage.dark ? '' : 1;
    wrapper.className = (wrapper.className === 'dark' ? 'light' : 'dark') ;
  };
  // ========================= MAIN LOGIC =========================

  //get('http://iliasky.com/www/homework/HW2.txt', function (data){
    var results = {};
    var text = $('results').innerHTML.split('§');
    var common = JSON.parse(text[0]);
    text[1].split('\n').forEach(function(e){  // 61000 - 0.7 - Name - comments
      e = e.split(' - ');
      results[e[0]] = {points: e[1], name: e[2], comments: e.slice(3).join(' - ')};
    });

    var select = $('hw-id');

    select.innerHTML = Object.keys(results).map(function (e) {
      return '<option value="' + e + '">' + e + '</option>';
    }).join('');
    select.value = location.hash.slice(1) || 80000;
    select.onchange = function () {
      if (location.hash.slice(1) != this.value) {
        location.hash = this.value;
      }
      var current = results[this.value >> 0];
      $('name').innerHTML = current.name;
      $('points').innerHTML = current.points;
      $('comments').innerHTML = commentsToHTML(current.comments, common);

      // $('comments').innerHTML = '<li>' + escapeHTML(current.comments).replace(/''/g, "'").replace(/(\. )/g, '.</li><li>') + '</li>';
    };
    select.onchange();
    window.onhashchange = function () {
      var hash = location.hash.slice(1);
      if (select.value != hash) {
        select.value = hash;
        select.onchange();
      }
    }
  //});