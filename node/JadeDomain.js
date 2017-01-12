(function () {
    "use strict";
    
    var jade = require("jade");
    var fs = require("fs");
    var path = require("path");
    var JI = require('jade-inheritance');

    function render(filepath, cwd, basename) {
        var html = jade.renderFile(filepath, { pretty: true });
        var outputFileName = path.join(cwd, basename.replace(/\.jade$/, ".html"));
        fs.writeFileSync(outputFileName, html);
    }

    function cmdRender(filepath) {
        filepath = path.normalize(filepath);
        var basename = path.basename(filepath);
        var ext = path.extname(basename);
        var cwd = path.dirname(filepath);

        if (basename[0] == "_") { // partial file
            var inheritance = new JI(filepath, cwd, {
                basedir: cwd
            });
            inheritance.files.forEach(function (file) {
                if (file[0] != "_") {
                    render(path.join(cwd, file), cwd, file);
                    console.log(file, " is rendered!");
                }
            });
        } else {
            render(filepath, cwd, basename);
        }
    }

    /**
     * Initializes the test domain with several test commands.
     * @param {DomainManager} domainManager The DomainManager for the server
     */
    function init(domainManager) {
        if (!domainManager.hasDomain("jade")) {
            domainManager.registerDomain("jade", {major: 0, minor: 1});
        }
        domainManager.registerCommand(
            "jade",       // domain name
            "render",    // command name
            cmdRender,   // command handler function
            false,          // this command is synchronous in Node
            "Convert jade file into HTML file",
            [{name: "fullpath", // parameters
                type: "string",
                description: "File fullpath"}]
        );
    }
    
    exports.init = init;    
}());
