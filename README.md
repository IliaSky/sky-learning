# Sky Learning

### A simple moodle alternative for a single course

## Requirements:
- mongodb
- node

##Usage:

  1. __Terminal__:

        sudo apt-get install node
        sudo apt-get install mongo
        npm install -g coffee-script
        mongod --dbpath PATH_TO_DATABASE_DIR

  2. __New Terminal__:

        mongo
        use learning
        db.users.insert({"username" : "your_admin", "password" : "your_admin_password", "admin" : 1 })
        db.meetings.insert({_id:ObjectId("000000000000000000000000")})
        exit

        coffee server.coffee

  3. __Browser__:

        http://localhost:8080/
