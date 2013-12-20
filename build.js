'use strict';

var EXTENSIONS_FOLDER = 'C:/Users/Forbes/AppData/Roaming/Brackets/extensions/user';

var fs = require('fs');
var rm = require('rimraf').sync;
var Zip = require('node-zip');

rm(__dirname + '/bin');
fs.mkdirSync(__dirname + '/bin');

var mode = fs.readFileSync(__dirname + '/lib/mode.js', 'utf8');

var bracketsPackage = JSON.parse(fs.readFileSync(__dirname + '/brackets-package.json', 'utf8'));
bracketsPackage.version = JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf8')).version;
bracketsPackage = JSON.stringify(bracketsPackage, null, '  ');

var plugin = '';
plugin += 'define(function (require, exports, module) {\n';
plugin += '  "use strict";\n\n';
plugin += mode.replace(/^/gm, '  ') + '\n\n';
plugin += '  var LanguageManager = brackets.getModule("language/LanguageManager");\n';
plugin += '  LanguageManager.defineLanguage("jade", ' + JSON.stringify(require('./lib/language-definition.js')) + ');\n';
plugin += '});';

var zip = new Zip();
zip.file('main.js', plugin);
zip.file('package.json', bracketsPackage);
fs.writeFileSync(__dirname + '/bin/jade.zip', zip.generate({base64:false,compression:'DEFLATE'}), 'binary');

if (fs.existsSync(EXTENSIONS_FOLDER)) {
  rm(EXTENSIONS_FOLDER + '/jade');
  fs.mkdirSync(EXTENSIONS_FOLDER + '/jade');
  fs.writeFileSync(EXTENSIONS_FOLDER + '/jade/package.json', bracketsPackage);
  fs.writeFileSync(EXTENSIONS_FOLDER + '/jade/main.js', plugin);
}

fs.mkdirSync(__dirname + '/bin/jade-highlight');
fs.writeFileSync(__dirname + '/bin/jade-highlight/index.js', '"use strict"\n'
  + 'var CodeMirror = require("highlight-codemirror");\n\n'
  + 'CodeMirror.loadMode("javascript");\n'
  + 'CodeMirror.loadMode("css");\n'
  + 'CodeMirror.loadMode("htmlmixed");\n'
  + 'CodeMirror.loadMode("markdown");\n'
  + mode + '\n\n'
  + 'module.exports = function (src, options) {\n'
  + '  options = options || {};\n'
  + '  options.name = "jade";\n'
  + '  return CodeMirror.highlight(src, options);\n'
  + '};');
