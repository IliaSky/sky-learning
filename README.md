# Sky Learning

### A simple moodle alternative for a single course

## Requirements:
- mongodb
- node

## Usage:

1. __Setup dependencies__:

   - Terminal:

         choco install node mongo
         npm install -g coffee-script
         npm install

   - *You can replace `choco` (Win) with `brew` (Mac) or `sudo apt-get` (Linux) depending on your OS.

2. __Setup DB__:

   - Optional

      Edit config/db.json (default settings for the db)

3. __Enjoy__:

   - Terminal:

         npm start

   - Browser:

         http://localhost:8080/
