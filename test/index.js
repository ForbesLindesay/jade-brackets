'use strict';

require('../build.js');
var fs = require('fs');
var assert = require('assert');
var Promise = require('promise');
var barrage = require('barrage');
var github = require('github-basic');
var highlight = require('../bin/jade-highlight');

var testCases;
before(function (done) {
  this.timeout(10000);
  if (!fs.existsSync(__dirname + '/cases')) fs.mkdirSync(__dirname + '/cases');
  github.json('GET', '/repos/:owner/:repo/contents/:path', {
    owner: 'visionmedia',
    repo: 'jade',
    path: 'test/cases'
  }).then(function (res) {
    return Promise.all(res.body.filter(function (file) {
      return /\.jade$/.test(file.name);
    }).map(function (file) {
      var name = file.name;
      var remoteSha = file.sha;
      var localSha;
      try {
        localSha = fs.readFileSync(__dirname + '/cases/' + name + '.sha', 'utf8');
      } catch (ex) { /* file does not exist */ }
      if (remoteSha === localSha) return name;
      console.dir(name);
      return github('GET', 'https://raw.github.com/:owner/:repo/master/:path/:file', {
        owner: 'visionmedia',
        repo: 'jade',
        path: 'test/cases',
        file: name
      }, {host: 'raw.github.com'}).then(function (res) {
        return barrage(res.body.pipe(fs.createWriteStream(__dirname + '/cases/' + name))).wait();
      }).then(function () {
        fs.writeFileSync(__dirname + '/cases/' + name + '.sha', remoteSha, 'utf8');
        return name;
      })
    }));
  }).done(function (names) {
    testCases = names;
    done();
  }, done);
});
it('can highlight all of the jade test cases', function () {
  console.log();
  if (!fs.existsSync(__dirname + '/expected-output')) fs.mkdirSync(__dirname + '/expected-output');
  if (!fs.existsSync(__dirname + '/output')) fs.mkdirSync(__dirname + '/output');
  for (var i = 0; i < testCases.length; i++) {
    var src = fs.readFileSync(__dirname + '/cases/' + testCases[i], 'utf8');
    var html = highlight(src).replace(/\r\n/g, '\n');
    var expectedLocation = __dirname + '/expected-output/' + testCases[i].replace(/\.jade$/, '.html');
    var actualLocation = __dirname + '/output/' + testCases[i].replace(/\.jade$/, '.html');
    fs.writeFileSync(actualLocation, html, 'utf8');
    if (fs.existsSync(expectedLocation)) {
      console.log('- ' + testCases[i]);
      assert.equal(fs.readFileSync(expectedLocation, 'utf8').replace(/\r\n/g, '\n'), html);
    } else {
      fs.writeFileSync(expectedLocation, html, 'utf8');
    }
  }
  console.log();
})
