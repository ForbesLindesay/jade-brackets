define(function (require, exports, module) {
  'use strict';



  var LanguageManager = brackets.getModule("language/LanguageManager");

  LanguageManager.defineLanguage("jade", {
    name: "Jade",
    mode: "jade",
    fileExtensions: ["jade"],
    lineComment: ["//"]
  });
});