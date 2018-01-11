//======================================================
//
//            Sky Generator 1.3 - an HTML generator inspired by Emmet
//                                  Made by IliaSky
//           skysite.free.bg     www.github.com/IliaSky     si1.free.bg
//
//======================================================
//
//                           INSTALL INSTRUCTIONS
// In this order:
//   1. <script type="text/javascript" src="sky_generator.js"></script>
//   2. Write your SG.VIEWS patterns
//   3. Enjoy your SG(pattern, object)
//   Note: even without step 2 you can use SG.wrap(html, selector)
//
//======================================================
//
//                           PATTERN INSTRUCTIONS
//
// $.VIEW = inserts view pattern from SG.VIEWS
// tag#id.class
  // #this.will.be.a.div.if.there.is.no.tag
// tag + tag
// element[text without html elements]
  // span[This content will be displayed in a span tag]
  // note[text inside square brackets is the only place where space matters]
  // [if tag, id and class are all missing then the text will be in a text node]
// tag(attribute:value)         tag(attr:val, attr:val)
  // a(href:#)[click me] + input(type: number, value: 5)
// outer-tag > inner-tag      outer{ inner + inner }
  // section{ h1[title] + atricle[content] }
// @var = inserts variable from current data object
// @(var){markup} = changes current object to object.var inside the brackets
// *markup = repeats the markup for each element in the current object (array)
//
//======================================================
//
//                     REAL WORLD EXAMPLE PATTERNS
//
/*
SG.VIEWS = {
  ID : "data-id:@id",
  RENT_RETURN : "div.rent-return > button.return-movie($.ID)[Return]+button.rent-movie($.ID)[Rent]",

  STORE : "a.store(href:#info/@id)[@title]",
  CATEGORY : "a.category(href:#category-info/@id,title:@name)[@name]",
  ACTOR : "a.actor(href:#actor-info/@id,title:@firstName_@lastName)[@firstName @lastName]",
  MOVIE : "h1{a.movie(href:#movie-info/@id)[@title]} + span.date[from @publishDate] +$.RENT_RETURN +article[@description]",

  STORES : "section#stores > h1[Stores] + nav > *$.STORE",
  CATEGORIES : "section#categories > h1[Categories] + nav > *$.CATEGORY",
  ACTORS : "section#actors > h1[Actors] + nav> *$.ACTOR",
  MOVIES : "ul#movies > *li > section > $.MOVIE",

  STORE_INFO : "section#store-info > h1{$.STORE} + @(movies){$.MOVIES}",
  CATEGORY_INFO : "section#category-info > h1{$.CATEGORY} + @(movies){$.MOVIES}",
  ACTOR_INFO : "section#actor-info > h1{$.ACTOR} + @(movies){$.MOVIES}",
  MOVIE_INFO : "div#movie-info >  @(actors){$.ACTORS} + section#movie-basic-info{$.MOVIE}+ $(categories){$.CATEGORIES} + @(stores){$.STORES}",

  USERNAME: "label(for:username)[Username]+input#username(type:text,required)",
  PASSWORD: "label(for:password)[Password]+input#password(type:password,required)",
  PASSWORD_AGAIN: "label(for:password-again)[Password Again]+input#password-again(type:password,required)",
  SUBMIT: "input(type:submit)",
  LOGIN : "form#login-form > $.USERNAME + $.PASSWORD + $.SUBMIT",
  REGISTER : "form#register-form> $.USERNAME + $.PASSWORD + $.PASSWORD_AGAIN + $.SUBMIT",

  FIND_CATEGORY : "form#search-form> label(for:search)[Search Categories]+input#search(placeholder:Search,list:search-data-list) + input(type:submit,value:Search) + datalist#search-data-list > *option(value:$name,$.ID)",

  ALL_CATEGORIES : "$.FIND_CATEGORY + $.CATEGORIES"
};
*/

//======================================================
(function() {

/***** indexOf and map for Older IE **********/
if(!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(element) {
    for (var i = 0, n = this.length; i < n; i++)
      if(this[i] === element)
        return i;
  return -1;
  };
}
if (!Array.prototype.map) {
  Array.prototype.map = function(func) {
    var output = [];
    for(var i = 0, n = this.length; i < n; i++)
      output[i] = func(this[i]);
    return output;
  };
}

SG = function (str, obj){
  var i, m, n, unclosedBrackets=0;

  // Change a>b+c>d+e to a{b+c{d+e}}
  str = deconstify(str);
  str = greaterThanToBrackets(str);

  // Remove all whitespace except for spaces inside []
  str = str.replace(/ (?=[^\[]*\])/g,'&nbsp;').replace(/[\s]/g,'').replace(/&nbsp;/g,' ');

  // If the pattern begins with * then returns the sum of the pattern filled with each element in the array(obj)
  if (str.charAt(0)=='*')
    return obj.map(function(x){ return SG(str.slice(1), x); }).join('');

  // render both sides of '+', not inside {} using recursion
  for(i=0, n=str.length; i <n ; i++){
    unclosedBrackets += (str.charAt(i)=='{') - (str.charAt(i)=='}');
    if (unclosedBrackets===0 && str.charAt(i)=='+')
      return SG(str.slice(0,i), obj) + SG(str.slice(i+1), obj);
  }

  // Change current object to object.innerObject when @(innerObject){}
  if (m = str.match(/^@\(([_a-z]+)\)\{(.*)\}/i))
    return obj[m[1]] ? SG(m[2],obj[m[1]]) : '';

  // Render only when SG.FLAGS[flag] is true when ?(flag){}
  if (m = str.match(/^\?\(([_a-z]+)\)\{(.*)\}/i))
    return SG.FLAGS[m[1]] ? SG(m[2],obj) : '';

  // render simple selector and content
  m = str.match(SG.REGEX.ELEMENT);
  var selector = m[1];
  var text     = (m[2] || '') + (m[3] ? SG(m[3], obj) : '');
  var value = SG.wrap(text, selector);

  // change @var with object.var
  for (i in obj)
    value = value.replace(RegExp('@'+i,'gi'), obj[i]);

  // change @@ with object
  return value.replace(/@@/gi, obj);
};
SG.VIEWS = {};
SG.FLAGS = {};
SG.SELF_CLOSING_TAGS = "area base br col hr img input link meta param command keygen source".split(' ');
SG.BOOLEAN_ATTRIBUTES = "async autofocus autoplay checked controls default defer disabled formnovalidate hidden ismap loop multiple muted novalidate open readonly required reversed scoped seamless selected truespeed typemustmatch".split(' ');

SG.REGEX = {
  SIMPLE_SELECTOR : /([?=\-_a-zA-Z0-9@.#(:\/,)$]*)/,
  INNER_ELEMENTS  : /(?:\{([?=\-_a-zA-Z0-9.#(:,)@$\[\] +*{}\/]*)\})?/,
  TEXT_NODE       : /(?:\[([\-_a-zA-Z0-9@$ ]*)\])?/,

  TAG   : /^([\-_a-zA-Z0-9$]*)/,
  ID    : /(?:#([\-_a-zA-Z0-9$]*))?/,
  CLASS : /([\-._a-zA-Z0-9$]*)/,
  ATTR  : /(?:\(([?=\/\-_a-zA-Z0-9@$:,#\/]*)\))?/
};
var regexConcat = function (arr){
  return RegExp(arr.map(function(e){return SG.REGEX[e].source;}).join(''));
};
SG.REGEX.SELECTOR = regexConcat(['TAG', 'ID', 'CLASS', 'ATTR']);
SG.REGEX.ELEMENT = regexConcat(['SIMPLE_SELECTOR', 'TEXT_NODE', 'INNER_ELEMENTS']);

var greaterThanToBrackets = function (str){
  return str.split('>').join('{')+ new Array(str.split('>').length).join('}');
};
var deconstify = function (str){
  for (var i in SG.VIEWS){
    var regex = RegExp('\\$\\.'+i+'(?=([^_a-z]|$))','gi');
    if (str.match(regex))
      str = str.replace(regex, deconstify(greaterThanToBrackets(SG.VIEWS[i])));
  }
  return str;
};

var attr = function (key,value){
  if (value)
    return ' ' + key + '="' + value + '"';
  if (SG.BOOLEAN_ATTRIBUTES.indexOf(key) != -1)
    return ' ' + key;
  return '';
};
var multipleAttributes = function (array){
  return array.map(function(kv){ return attr(kv[0], kv[1]); }).join('');
};
SG.wrap = function (html, selector){
  var m = selector.match(SG.REGEX.SELECTOR);

  var tag = m[1];
  var id = m[2];
  var klass = m[3].slice(1).split('.').join(' ');
  var attributes = (m[4] || '').split(',').map(function(kv){ return kv.split(':'); });

  // set href of anchor tag to # if missing
  var attrNames = attributes.map(function(kv){ return kv[0]; });
  if (tag == 'a' && attrNames.indexOf('href') == -1)
    attributes.push(['href','#']);

  if (tag == 'input' && html !== '')
    attributes.push(['value', html.replace(/"/g, '\"')]);

  // return text node if there is no selector
  if (tag + id  + klass === '')
    return html;

  // make div the default tag
  tag = tag || 'div';

  // create text of opening tag
  var text = tag + attr('id',id) + attr('class',klass) + multipleAttributes(attributes);

  // create self closing tag
  if (SG.SELF_CLOSING_TAGS.indexOf(tag) != -1)
    return "<" + text +" />";

  // create normal tag
  return "<" + text +">" + html + "</" + tag +">";
};


})();