prompt = require('prompt')
config = require('../config/db.json')
ObjectID = require('mongodb').ObjectID

promptCredentials = (cb) ->
    prompt.start()
    prompt.get([{
        description: 'Please enter admin username',
        name: 'username',
        default: config.username || 'admin',
        required: true
      }, {
        description: 'Please enter admin password',
        name: 'password',
        hidden: true,
        replace: '*',
        required: true
      }], (err, result) -> if err then console.log(err) else cb(result)
    )

addAdmin = (db, config) ->
  db.users.insert
    username: config.username,
    password: config.password,
    admin: 1,
    (err, data) ->
      console.log(err || '  Admin account created')
      checkIfDone(admin: data) if !err

addMeeting = (db) ->
  # console.log('Meeting not found in database.')
  db.meetings.insert _id: ObjectID("000000000000000000000000"), id: 'm55-555-555', (err, data) ->
    console.log(err) if err
    checkIfDone(meeting: data) if !err
    # console.log(err || '  Meeting added')

setupAdmin = (db) ->
  console.log('Admin account not found in database.');

  if (!config.username || !config.password)
    console.log('Admin credentials not found in config/db.json.')
    promptCredentials (config) -> addAdmin(db, config)
  else
    console.log('Creating admin using credentials from config/db.json.')
    addAdmin db, config

found = {}

checkIfDone = (obj) ->
  ['meeting', 'admin'].forEach (name) ->
    found[name] ?= obj[name]

  # console.log(found) if require.main == module

  process.exit() if found.meeting && found.admin && require.main == module

setup = (db) ->

  db.users.findOne admin: 1, (err, admin) ->
    console.log(err) if err

    setupAdmin(db) if !admin

    checkIfDone {admin}


  db.meetings.findOne {}, (err, meeting) ->
    console.log(err) if err

    checkIfDone {meeting}

    addMeeting(db) if !meeting

module.exports = setup

if require.main == module
  # spawn = require('child_process').spawn;

  db = require('mongojs')(config.db || 'localhost/learning')
  setup(db)
  # child = spawn 'mongod', ['--dbpath', 'db'] #, detached: true #, stdio: 'ignore'

  # child.stdout.on 'data', (data) ->
  #   # console.log('child stdout:\n' + data)
  #   if data.includes 'waiting for connections'
  #     console.log('connecting to db')
  #     db = require('mongojs')(config.db || 'localhost/learning')
  #     console.log('connected to db')
  #     setup(db)
  #   if data.includes 'exception in'
  #     error = data.toString().match(/^.*exception in.*$/m)
  #     if error.includes 'Is a mongod instance already running'

  #     else
  #       console.log('ERROR: ' + error)
  #       if data.includes 'dbexit: really exiting now'
  #         console.log('DB is shutting down')

  # child.stderr.on 'data', (data) ->
  #   console.log('Mongo Error:' + data)


  console.log('DB setup is Main')
