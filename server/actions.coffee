db = require('./db')
utils = require('./utils')

module.exports =
  public:
    news:     db.all('announcements')
    lectures: db.all('lectures')
    topics:   db.all('topics')
    tasks:    db.all('tasks')
    users:    db.all('users')
    team:     db.those('users').where(admin: 1)

    avatar:   db.avatar
    register: db.register
    teamviewer: db.one('meetings')



    # login: (user, cb) ->
    #   db.authenticate data.user (account) -> cb('', account.user)

  user:
    profile: (user, data, cb) ->
      db.one('users') user, cb

    'solution/add': (user, data, cb) ->
      db.all 'tasks', _id: data.task_id, (tasks) ->
        if tasks.length > 0 and tasks[0].available_until > new Date()
          db.add('solution') user, data, cb

    changeAvatar: db.changeAvatar
    # logout: ->
