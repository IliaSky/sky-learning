db = require('./db')

module.exports =
  resources:
    public:
      all: ['announcements', 'lectures', 'tasks', 'topics', 'users']
      one: ['topics', 'announcements', 'lectures', 'tasks']

    user:
      add: ['topics', 'posts']

    admin:
      add:    ['announcements', 'lectures', 'tasks']
      edit:   ['announcements', 'lectures', 'tasks', 'meetings']
      remove: ['announcements', 'lectures', 'tasks']

  aliases: # do we really need this?
    all: ''
    one: '/one'
    add: '/add'
    edit: '/edit'
    remove: '/remove'

  getRoutes: -> # is there a more elegant way to do this ?
    routes = {}
    for user, actions of @resources
      routes[user] = {}
      for action, resources of actions
        for resource in resources
          routes[user][resource + @aliases[action]] = db[action](resource)
    routes

# routes = hash ([name, {}] for name in Object.keys(@resources))
# u=user, r=resource, a=action
# routes[u][r + aliases[a]] = db[a](r) for r in a for a of u for u of @resources

# for k, v of @resources
#   routes[k] = (hash [r + aliases[a], db[a](r)] for r in v[a] for a of v)[0]

# hash([k, hash ([r + @aliases[a], db[a](r)] for r in v[a] for a of v)[0] ] for k, v of @resources)