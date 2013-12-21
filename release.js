'use strict';

var path = require('path');
var Promise = require('promise');
var winSpawn = require('win-spawn');
function spawn(cmd, args, options) {
  return new Promise(function (resolve, reject) {
    var proc = winSpawn(cmd, args, options);
    proc.on('exit', function (code) {
      if (code !== 0) reject(new Error(cmd + ' exited with code ' + code));
      else resolve(null);
    });
  });
}

spawn('npm', ['publish'], {stdio: 'inherit', cwd: path.normalize(__dirname + '/bin/jade-highlight')})
  .then(function () {
    return spawn('npm', ['publish'], {stdio: 'inherit', cwd: path.normalize(__dirname + '/bin/jade-code-mirror')})
  });
