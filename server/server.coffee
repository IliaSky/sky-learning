# require 'coffee-script/register'
require 'colors'
connect2 = require('connect')
bodyParser = require('body-parser')
connect = {
  static: require('serve-static'),
  logger: require('morgan'),
  cookieParser: require('cookie-parser'),
  session: require('express-session'),
  urlencoded: bodyParser.urlencoded,
  json: bodyParser.json
}
db      = require('./db')
utils   = require('./utils')
routes  = utils.deepExtend require('./resources').getRoutes(), require('./actions')
[log, respond, send, getData, getPath] = [utils.log, utils.respond, utils.send, utils.getData, utils.getPath]
json = JSON.stringify
parse = JSON.parse

handleRequest = (req, res) ->
  data = getData(req)
  url  = getPath(req)
  user = req.session.user ?= {}
  log user.username
  # user = JSON.parse ((req.headers.cookie or '').match(/user=([^;]+);?/) || '{}')[1]
  account = {user: user.username, admin: user.admin}
  res.send = send

  if url is 'login'
    return db.authenticate data, (user) ->
      res.send(200, req.session.user = user || {})

  if url is 'logout'
    return res.send(200, req.session.user = {})

  # Public routes
  if routes.public.hasOwnProperty(url)
    return routes.public[url] data, respond(res)

  # User routes
  for type in ['user', 'admin']
    if routes[type].hasOwnProperty(url)
      if account[type]
        return routes[type][url] user, data, respond(res)
      else
        return res.send 302, status: 302, response: 'Unauthorized action'

  res.send(404)

process.on 'uncaughtException', (err) -> log(err.stack)

require('http').createServer(
  connect2()
    .use((req, res, next)->
      res.setHeader 'Access-Control-Allow-Origin', '*'
      res.setHeader 'Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'
      next();
    )
    .use(connect.static 'client')
    .use(connect.logger 'dev')
    .use(connect.cookieParser())
    .use(connect.session secret: 'sasa_matic', saveUninitialized: true, resave: true)
    .use(connect.urlencoded extended: true)
    .use(connect.json())
    .use (req, res) ->
      try
        handleRequest req, res
      catch err
        log err.stack
).listen 8080

log 'Welcome to SkyLearning'.cyan

