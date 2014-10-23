url = require('url')

module.exports =
  log: (data) -> console.log(data); data

  # wait: (milliseconds) -> then: (func) -> setTimeout func, milliseconds

  extend: (a, b) -> a[i] = b[i] for i of b; a

  deepExtend: (a, b) ->a[i][j] = b[i][j] for j of b[i] for i of b; a

  # export: -> process[key] = value for key, value of this # experimental

  # from: (_import)-> export: (names) -> to: (_export) ->
  #   _export[i] = _import[name] for name, i in names

  getData: (req) ->
    if req.method is 'GET' then url.parse(req.url, true).query else req.body

  getPath: (req) -> url.parse(req.url, true).pathname.slice(1)
  # getPath: (req) -> req.url.slice(1).split('?').shift().slice(1)

  send: (code, data, type) ->
    # log('500:' + json(data)) if code is 500
    this.writeHead code, 'content-type': type or 'text/json'
    this.end(type && data || JSON.stringify(data))

  respond: (res) ->
    f = (err, data) -> if err then res.send(500, console.log err.stack) else res.send(200, data)
    f.res = res
    f

  filter: (object, keys) ->
    result = {}
    result[key] = (object[key] || '').toString() for key in keys
    result

  hash: (pairs) ->
    result = {}
    result[key] = value for [key, value] in pairs
    result


  # validated: (type, data, user) ->
  #   _schema =
  #     user:         ['username', 'password']
  #     announcement: ['title', 'content', 'date']
  #     lecture:      ['title', 'id', 'url', 'date']
  #     task:         ['title', 'id', 'description', 'date']
  #     post:         ['content']
  #     topic:        ['title', 'id', 'date', posts: ['post']]

  # _validated: (data, properties) ->
  #   filter(data, properties)
