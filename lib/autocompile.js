  var CodeMirror = brackets.getModule("thirdparty/CodeMirror/lib/codemirror");
  var ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
      NodeDomain     = brackets.getModule("utils/NodeDomain");

  var jadeDomain = new NodeDomain("jade", ExtensionUtils.getModulePath(module, "node/JadeDomain"));
  var PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
      prefs = PreferencesManager.getExtensionPrefs("jade");
  // Helper function that runs the simple.getMemory command and
  // logs the result to the console
  function render(fullpath) {
      jadeDomain.exec("render", fullpath)
          .done(function (msg) {
              console.log("[brackets-jade-node] jade success", msg );
          }).fail(function (err) {
              console.error("[brackets-jade-node] failed to run jade", err);
          });
  }

  var DocumentManager = brackets.getModule("document/DocumentManager");
  DocumentManager.on("documentSaved", function (event, file) {
      var fullpath = file.file.fullPath; 
      var filename = file.file.name;
      // var cwd = file.file.parentPath;
      if (event.type === "documentSaved" && file.file.isFile) {
	  if (filename.match(/\.jade$/) || (filename[0] == "_" && filename.match(/\.html$/))) {
              // if (prefs.get('enabled')) {
                  render(fullpath);
              // }
          }
      }
  });
