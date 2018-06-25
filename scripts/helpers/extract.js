var fs = require('fs'),
 os = require('os'),
 resolve = require('path').resolve,
 exec = require('child_process').exec,
 q = os.platform().startsWith('win') ? '"' : "'",
 rq = new RegExp(q, 'g'),
 escape = (x) => q + x.replace(rq, '\\' + q) + q;

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
        console.log('================== CMD: ' + cmd);
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
    console.warn('unrar cmd not found, using node-7z for rars instead.');
}
['zip', 'rar', '7z', 'any'].forEach(key => {
    var old = extract[key];
    extract[key] = function (source, destination, cb) {
        source = resolve(source);
        destination = destination || source.replace(/\....?$/, '');
        cb = cb || (e => e && console.log(e));
        old.call(this, source, destination, cb);
    }
});

module.exports = extract;

if (require.main === module) {
    extract.any(process.argv[2], process.argv[3]);
}
