# Sky Learning

### A simple moodle alternative for a single course

## Requirements:
- mongodb
- node

## Usage:

1. __Setup dependencies__:

   - Terminal:

         choco install node
         choco install mongo
         npm install -g coffee-script
         npm install

   - *You can replace `choco` (Win) with `brew` (Mac) or `sudo apt-get` (Linux) depending on your OS.

2. __Setup DB__:

   - Terminal 1:

         mkdir db
         mongod --dbpath db

   - Terminal 2:

         mongo
         use learning
         db.users.insert({"username" : "your_admin", "password" : "your_admin_password", "admin" : 1 })
         db.meetings.insert({_id: ObjectId("000000000000000000000000")})
         exit

3. __Enjoy__:

   - Terminal:

         npm start

   - Browser:

         http://localhost:8080/
