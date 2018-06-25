var fs = require('fs'),
 glob = require('glob'),
 async = require('async'),
 os = require('os'),
 exec = require('child_process').exec,
 q = os.platform().startsWith('win') ? '"' : "'",
 rq = new RegExp(q, 'g'),
 escape = (x) => q + x.replace(rq, '\\' + q) + q;
//then(_ => cb()).catch(cb).
//https://www.rarlab.com/rar_add.htm
var unrarExists = require('command-exists').sync('unrar');

var extract = {
    _zip: require('extract-zip'),
    _rar: require('unrar'),
    _7z: require('node-7z'),
    failed: [],
    zip: (archive, destination, cb) => extract._zip(archive, {dir: destination}, cb),
    '7z':(archive, destination, cb) => new extract._7z().extractFull(archive, destination, {}).then(_ => cb()).catch(e => {
        cb('archive ' + archive + ' failed to extract');
        extract.failed.push(archive);
    }),
    rar: (archive, destination, cb) => {
        var cmd = 'unrar e ' + escape(archive) + ' ' + escape(destination);
        console.log('================== CMD: ' + cmd)
        exec(cmd, (e, data) => {
            if (e) {
                extract['7z'](archive, destination, cb)
            } else {
                cb(e, data);
            }
        });
    },
    // rar: (archive, destination, cb) => new extract._rar(__dirname + '/' + archive).extract(destination, null, (e, data) => {
    //     console.log('==================\n' + e + '\n==================\n');
    //     cb(e);
    // }),
    // rar:(archive, destination, cb) => new extract._7z().extractFull(archive, destination, {}).then(_ => cb()).catch(e => {
    //     cb('archive ' + archive + ' failed to extract');
    //     extract.failed.push(archive);
    // }),
    any: (archive, destination, cb) => {
        var ext = archive.split('.').pop();
        if (ext.match(/zip|rar|7z/)) {
            ext = unrarExists ? 'rar' : ext;//.replace('rar', '7z');
            extract[ext](archive, destination, cb);
        } else {
            console.log('Unsupported extension ' + ext);
            cb();
        }
    }
};
if (!unrarExists) {
    extract.rar = extract['7z'];
    console.warn('unrar cmd not found, using node-7z instead. some rar files may have a problem.');
}


var onErr = err => err ? console.error(err) : '';

var rename = (names, transform, cb) => {
    async.each(names, (name, cb) => {
        fs.rename(name, transform(name), cb);
    }, cb);
};
var rimraf = require('rimraf');
//name.split('_')[0]
var app = {
    folders: [],
    cleanTargetFolder: (cb) => {
        app.loadFolders(_ => async.each(app.folders, rimraf, cb));
    },
    extractMainArchive: (cb) => {
        extract.zip( __dirname + '/' + location + 'homeworks.zip', __dirname + '/' + location, cb);
    },
    loadFolders: (cb) => {
        var files = fs.readdirSync(location);
        // onErr(err);
        app.folders = files.map(e => location + e).filter(file => fs.statSync(file).isDirectory());
        cb();
    },
    loadAllStudents: (cb) => {
        var data = fs.readFileSync('students.txt', 'utf8');
        // onErr(err);
        app.students = data.split(/[\r\n]+/).map(e => {
            var [fn, name] = e.split('\t');
            var [first, middle, last] = name.split(' ');
            return {fn: fn, name: first + ' ' + last};
        });
        cb();
    },
    cleanFolderNames: (cb) => {
        rename(app.folders, name => name.split('_')[0], cb)
    },
    filterStudents: (cb) => {
        app.students = app.students.filter(e => {
            return app.folders.includes(location + e.name) || app.folders.includes(location + e.fn)
        });
        cb();
    },
    saveStudents: (cb) => {
        fs.writeFile(location + 'students.json', JSON.stringify(app.students, null, 2), cb);
    },
    loadRelevantStudents: (cb) => {
        fs.readFile(location + 'students.json', (err, data) => {
            if (err) return cb(err);
            app.students = JSON.parse(data);
            cb();
        });
    },
    updateFolderNames: (cb) => {
        rename(app.folders, name => {
            name = name.slice(location.length);
            var student = app.students.find(e => e.name == name);
            if (!student) {
                if (!app.students.find(e => e.fn == name)) {
                    console.warn('Student ' + name + ' not found');
                }
            }

            return location + (student ? student.fn : name);
        }, cb);
    },
    extractArchives: (cb) => {
        glob(location + '*/*.+(zip|rar|7z)', function(_, archives) {
            console.log('Found ' + archives.length + ' archives');
            async.each(archives, (archive, cb) => {
                var dir = archive.replace(/\/[^\/]+\.(zip|rar|7z)$/, '/');

                extract.any(archive, __dirname + '/' + dir, (err) => {
                    if (err) {
                        console.log('archive ' + archive + ' failed to etract');
                        console.log(err);
                    }
                    cb();
                });
            }, cb);
            // ;
        });
    },
    deleteArchives: (cb) => {
        glob(location + '*/*.+(zip|rar|7z)', {dot:true}, function(_, archives) {
            async.each(archives.filter(e => !extract.failed.includes(e)), fs.unlink, cb)
        });
    },
    saveFileMaps: (cb) => {
        var allFiles = {};
        async.map(app.students, (student, cb) => {
            glob(location + student.fn + '/**/*' , function(_, files) {
                files = files.map(e => e.split(student.fn).slice(1).join(student.fn))
                    .filter(e => e.includes('.'))
                    .filter(e => !e.endsWith('.html.txt') && !files.includes(e.replace(/\.txt$/, '')))
                    .filter(e => (/.(?:html|css|js|php|rb|py)$/).test(e));
                console.log(files);
                allFiles[student.fn] = files;
                // student.files = files;
                // student.files = {
                //     html: files.filter(e => e.endsWith('.html')),
                //     css: files.filter(e => e.endsWith('.css')),
                //     js: files.filter(e => e.endsWith('.js')),
                //     others: files.filter(e => !e.match(/\.(html|css|js)/))
                // };
                cb();
            });
        }, (err, data) => {
            if (err) return cb(err);
            fs.writeFile(location + 'files.json', JSON.stringify(allFiles), cb);
        });
    },
    saveFilesAsJSON: (cb) => {
        fs.readFile(location + 'files.json', 'utf8', (err, data) => {
            if (err) return cb(err);
            var allFiles = JSON.parse(data);
            async.each(Object.keys(allFiles), (key, cb) => {
                var filenames = allFiles[key];
                async.map(filenames, (filename, cb) => {
                    fs.readFile(`${location}${key}/${filename}`, 'utf8', cb);
                }, (err, data) => {
                    if (err) return cb(err);
                    allFiles[key] = filenames.map((name, i) => ({[name]: data[i]})).reduce((a, b) => Object.assign(a, b), {});
                    cb();
                });
            }, (err) => {
                if (err) return cb(err);
                fs.writeFile(location + 'filesData.json', JSON.stringify(allFiles), cb);
            });
        });
    },
    main: () => {
        async.waterfall([
            app.cleanTargetFolder,   // Remove subfolders from extract target folder
            app.extractMainArchive,  // Extract main archive
            app.loadFolders,         // Load all subfolders

            app.cleanFolderNames,    // Leave only students' names as folder names
            app.loadFolders,         // Reload new folders

            app.loadAllStudents,     // Load all students in the course
            app.filterStudents,      // Filter students that submitted the homework
            app.saveStudents,        // Save them to students.json
            app.updateFolderNames,   // Change folder names to FNs

            app.extractArchives,     // Extract students' archives
            app.deleteArchives,      // Remove the archives

            app.saveFileMaps,        // Save file locations to files.json
            app.saveFilesAsJSON      // Save file data to filesData.json
        ], onErr);
    },
    update: () => {                  // after manually extracting problem archives
        async.waterfall([
            app.loadRelevantStudents,// Load students.json
            app.saveFileMaps,        // Save file locations to files.json
            app.saveFilesAsJSON      // Save file data to filesData.json
        ], onErr);
    }
};
Object.entries(app).forEach(([name, value]) => {
    if (typeof value == 'function') {
        var old = app[name];
        app[name] = cb => {
            console.log(name + ' start');
            old(err => {
                // console.log(name + ' end');
                cb(err);
            })
        }
    }
});

var mode = process.argv[2] || 'update';
var location = '../data/' + (process.argv[3] || '2/');

mode == 'update' ? app.update() : app.main();
