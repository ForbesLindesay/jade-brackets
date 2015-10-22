'use strict';

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

var EXTENSIONS_FOLDER = getUserHome() + '/Library/Application Support/Brackets/extensions/user';

var fs = require('fs-extra');
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

var autocompile = fs.readFileSync(__dirname + '/lib/autocompile.js', 'utf8');
var mode = fs.readFileSync(__dirname + '/lib/mode.js', 'utf8');
mode += ';' + fs.readFileSync(__dirname + '/lib/overlay.js', 'utf8');

// BRACKETS PACKAGE

var bracketsPackage = pkg('brackets');

var htmlStructure = 'var HTML_STRUCTURE_MODULE = (function () {\n  var exports = {};\n  var module = {exports: exports};\n  (function (module, exports) {'
  + fs.readFileSync(__dirname + '/lib/autocomplete/html-structure.js', 'utf8').replace(/^/gm, '    ')
  + '\n  }(module, exports));\n  return module.exports;\n}());';

var autocomplete = fs.readFileSync(__dirname + '/lib/autocomplete/index.js', 'utf8').replace(/\brequire\(\'\.\/html-structure\.js\'\)/g, 'HTML_STRUCTURE_MODULE');

var plugin = '';
plugin += 'define(function (require, exports, module) {\n';
plugin += '  "use strict";\n\n';
plugin += '  ' + autocompile.replace(/\n/gm, '\n  ') + '\n\n';
plugin += '  ' + mode.replace(/\n/gm, '\n  ') + '\n\n';
plugin += '  var LanguageManager = brackets.getModule("language/LanguageManager");\n';
plugin += '  LanguageManager.defineLanguage("jade", ' + JSON.stringify(require('./lib/language-definition.js')) + ');\n';
plugin += '  ' + htmlStructure.replace(/\n/gm, '\n  ') + '\n'
plugin += '  ' + autocomplete.replace(/\n/gm, '\n  ') + '\n'
plugin += '});';

var zip = new Zip();
zip.file('main.js', plugin);
zip.file('package.json', bracketsPackage);
zip.file('LICENSE', fs.readFileSync(__dirname + '/LICENSE', 'utf8'));
zip.file('node/JadeDomain.js', fs.readFileSync(__dirname + '/node/JadeDomain.js', 'utf8'));
fs.writeFileSync(__dirname + '/bin/jade.zip', zip.generate({base64:false,compression:'DEFLATE'}), 'binary');

if (fs.existsSync(EXTENSIONS_FOLDER)) {
  rm(EXTENSIONS_FOLDER + '/jade');
  fs.mkdirSync(EXTENSIONS_FOLDER + '/jade');
  fs.writeFileSync(EXTENSIONS_FOLDER + '/jade/package.json', bracketsPackage);
  fs.writeFileSync(EXTENSIONS_FOLDER + '/jade/main.js', plugin);
  fs.mkdirSync(EXTENSIONS_FOLDER + '/jade/node');
  fs.copySync(__dirname + "/node/JadeDomain.js", EXTENSIONS_FOLDER + '/jade/node/JadeDomain.js');
  console.log('updated plugin');
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
