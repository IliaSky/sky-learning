# module.exports = require('mongojs').connect('localhost/learning', ['news', 'lectures', 'tasks', 'topics', 'users'])
utils = require('./utils')
log = utils.log
ObjectID = require('mongodb').ObjectID
fs = require('fs')

_id = (x) -> if typeof x is 'string' then ObjectID(x) else x
id  = (x) -> _id: _id(x._id)

db = require('mongojs').connect('localhost/learning', ['announcements', 'lectures', 'tasks', 'topics', 'users', 'meetings'])

schema =
  user:         {'username', 'password', 'avatar'}
  announcement: {'title', 'content'}
  lecture:      {'title', 'url', 'presentation_date'}
  task:         {'title', 'description', 'available_until'}
  solution:     {'code', 'task_id'}
  post:         {'content'}
  # topic:        {'title', 'post'}
  topic:        {'title', posts: ['post']}
  meeting:      {'id'}

validate = (object, type) ->
  pattern = schema[type]
  result = {}
  for key, type of pattern
    if type instanceof Array
      # result[key] = (validate(object[key][i], type[i]) for i in pattern[key])
      result[key] = [validate(object[key][0], type[0])]

    else if schema.hasOwnProperty(type)
      result[key] = validate(object[key], type)

    else
      object[key] ?= ''
      result[key] = object[key].toString()

  result

# validate = (object, type) ->
#   result = {}
#   for name of schema[type]
#     object[name] ?= ''
#     result[name] = object[name].toString()
#   result

  # these things look really bad here :(
  # hash([name, (object[name] or '').toString()] for name of schema[type])


_new = (category, data, author) ->
  type = category.slice(0, -1)
  result = utils.extend validate(data, type), {author: author.username, created_at: new Date()}
  if type is 'topic'
    utils.extend result.posts[0], {author: author.username, created_at: new Date()}
  result

all = (category) -> (data, cb) ->
  filters =
    topics: {posts: 0}
    users: {password: 0}
  db[category].find(data, filters[category] or {}).sort created_at: -1 , cb

one = (category) -> (data, cb) ->
  data = id(data) if data.hasOwnProperty('_id')
  db[category].findOne data, {_id:0}, cb

those = (category) -> where: (data) -> (_, cb) ->
  all(category)(data, cb)

add = (category) -> (user, data, cb) ->
  if category is 'posts'
    db.topics.update id(data), $push: posts: _new('posts', data, user), cb
  else
    db[category].insert _new(category, data, user), cb

edit = (category) -> (user, data, cb) ->
  return cb('Editing posts is not allowed') if category is 'posts'
    # db.topics.update {_id: data.topic_id.toString()}, $push: _new('post', data, user), cb
  db[category].update id(data), $set: _new(category, data, user), cb

remove = (category) -> (user, data, cb) ->
  return cb('Removing posts is not allowed') if category is 'posts'
  db[category].remove id(data), cb

authenticate = (user, cb) ->
  db.users.findOne utils.filter(user, ['username', 'password']), (err, data) ->
    cb(data)
    # return cb(user: 1, admin: 1) if data and data.admin
    # return cb(user: 1) if data
    # cb({})

register = (user, cb) ->
  user = validate(user, 'user')
  utils.extend user, author: user.username, created_at: new Date()
  db.users.insert user, cb

avatar = (user, cb) ->
  db.users.findOne user, (err, user) ->
    if user and user.avatar
      return cb.res.send(200, new Buffer(user.avatar.slice(23), "base64"), 'image/jpeg')
    try
      return fs.readFile 'NoAvatar.png', (_, img) -> cb.res.send(200, img, 'image/png')
    catch e
    return cb.res.send(404)

changeAvatar = (user, data, cb) ->
  db.users.update id(user), {$set: avatar: data.image}, cb

module.exports = {id, db, schema, validate, authenticate, register, avatar, changeAvatar,
                  _new, all, one, those, add, edit, remove}