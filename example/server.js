'use strict';

var fs = require('fs');
var express = require('express');
var jade = require('jade');

var app = express();

app.get('/', function (req, res) {
  res.send(jade.renderFile(__dirname + '/index.jade', {}));
});
app.get('/jade.js', function (req, res) {
  var text = fs.readFileSync(__dirname + '/../lib/mode.js', 'utf8');
  res.end(text);
});


app.listen(3000);