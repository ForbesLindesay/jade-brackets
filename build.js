'use strict';

var EXTENSIONS_FOLDER = 'C:/Users/Forbes/AppData/Roaming/Brackets/extensions/user';

var fs = require('fs');
var rm = require('rimraf').sync;
var Zip = require('node-zip');

rm(__dirname + '/bin');
fs.mkdirSync(__dirname + '/bin');

var version = JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf8')).version;

function pkg(name) {
  var pkg = JSON.parse(fs.readFileSync(__dirname + '/' + name + '-package.json', 'utf8'));
  pkg.version = version;
  return JSON.stringify(pkg, null, '  ');
}

var mode = fs.readFileSync(__dirname + '/lib/mode.js', 'utf8');


// BRACKETS PACKAGE

var bracketsPackage = pkg('brackets');

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
zip.file('LICENSE', fs.readFileSync(__dirname + '/LICENSE', 'utf8'));
fs.writeFileSync(__dirname + '/bin/jade.zip', zip.generate({base64:false,compression:'DEFLATE'}), 'binary');

if (fs.existsSync(EXTENSIONS_FOLDER)) {
  rm(EXTENSIONS_FOLDER + '/jade');
  fs.mkdirSync(EXTENSIONS_FOLDER + '/jade');
  fs.writeFileSync(EXTENSIONS_FOLDER + '/jade/package.json', bracketsPackage);
  fs.writeFileSync(EXTENSIONS_FOLDER + '/jade/main.js', plugin);
}

// SYNTAX HIGHLIGHTER FOR NODE

var highlighter = '"use strict"\n\n'
  + 'var CodeMirror = require("highlight-codemirror");\n\n'
  + 'CodeMirror.loadMode("javascript");\n'
  + 'CodeMirror.loadMode("css");\n'
  + 'CodeMirror.loadMode("xml");\n'
  + 'CodeMirror.loadMode("htmlmixed");\n'
  + 'CodeMirror.loadMode("markdown");\n'
  + mode + '\n\n'
  + 'module.exports = function (src, options) {\n'
  + '  options = options || {};\n'
  + '  options.name = "jade";\n'
  + '  return CodeMirror.highlight(src, options);\n'
  + '};\n\n'
  + 'module.exports.loadMode = CodeMirror.loadMode.bind(CodeMirror);\n'
  + 'module.exports.runMode = CodeMirror.runMode.bind(CodeMirror);\n';

fs.mkdirSync(__dirname + '/bin/jade-highlight');
fs.writeFileSync(__dirname + '/bin/jade-highlight/index.js', highlighter);
fs.writeFileSync(__dirname + '/bin/jade-highlight/package.json', pkg('highlighter'));
fs.writeFileSync(__dirname + '/bin/jade-highlight/README.md', fs.readFileSync(__dirname + '/README.md'));
fs.writeFileSync(__dirname + '/bin/jade-highlight/LICENSE', fs.readFileSync(__dirname + '/LICENSE'));

// CODE MIRROR MODE IN NPM

var codemirrorMode = '"use strict";\n\n'
  + 'var CodeMirror = require("code-mirror");\n\n'
  + 'require("code-mirror/mode/javascript")\n'
  + 'require("code-mirror/mode/css")\n'
  + 'require("code-mirror/mode/htmlmixed")\n'
  + 'require("code-mirror/mode/markdown")\n\n'
  + mode + '\n\n'
  + 'module.exports = CodeMirror\n';


fs.mkdirSync(__dirname + '/bin/jade-code-mirror');
fs.writeFileSync(__dirname + '/bin/jade-code-mirror/index.js', codemirrorMode);
fs.writeFileSync(__dirname + '/bin/jade-code-mirror/package.json', pkg('code-mirror'));
fs.writeFileSync(__dirname + '/bin/jade-code-mirror/README.md', fs.readFileSync(__dirname + '/README.md'));
fs.writeFileSync(__dirname + '/bin/jade-code-mirror/LICENSE', fs.readFileSync(__dirname + '/LICENSE'));
