'use strict';

var fs = require('fs');
var express = require('express');
var jade = require('jade');
var browserify = require('browserify-middleware');

var app = express();

app.get('/', function (req, res) {
  console.dir(process.argv);
  res.send(jade.renderFile(__dirname + '/index.jade', {
    browserify: process.argv.indexOf('--browserify') !== -1 || process.argv.indexOf('-b') !== -1
  }));
});
app.get('/jade.js', function (req, res) {
  var text = fs.readFileSync(__dirname + '/../lib/mode.js', 'utf8');
  res.end(text);
});

app.get('/index.js', browserify('./index.js'));

app.listen(3000);

console.log('Listening on localhost:3000');
