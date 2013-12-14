'use strict';

var EXTENSIONS_FOLDER = 'C:/Users/Forbes/AppData/Roaming/Brackets/extensions/user';

var fs = require('fs');
var rm = require('rimraf').sync;

rm(__dirname + '/bin');
fs.mkdirSync(__dirname + '/bin');

var plugin = '';

plugin += 'define(function (require, exports, module) {\n';
plugin += '  "use strict";\n\n';

plugin += fs.readFileSync(__dirname + '/lib/mode.js', 'utf8').replace(/^/gm, '  ') + '\n\n';
plugin += '  var LanguageManager = brackets.getModule("language/LanguageManager");\n';
plugin += '  LanguageManager.defineLanguage("jade", ' + JSON.stringify(require('./lib/language-definition.js')) + ');\n';
plugin += '});';

fs.writeFileSync(__dirname + '/bin/main.js', plugin);
fs.writeFileSync(__dirname + '/bin/package.json', fs.readFileSync(__dirname + '/brackets-package.json'));

if (fs.existsSync(EXTENSIONS_FOLDER)) {
  rm(EXTENSIONS_FOLDER + '/jade');
  fs.mkdirSync(EXTENSIONS_FOLDER + '/jade');
  fs.writeFileSync(EXTENSIONS_FOLDER + '/jade/package.json', fs.readFileSync(__dirname + '/bin/package.json'));
  fs.writeFileSync(EXTENSIONS_FOLDER + '/jade/main.js', fs.readFileSync(__dirname + '/bin/main.js'));
}
