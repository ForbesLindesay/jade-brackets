(function () {
    "use strict";
    
    var jade = require("jade");
    var fs = require("fs");
    var path = require("path");
        
    function cmdRender(fullpath) {
        var html = jade.renderFile(fullpath, { pretty: true });
        var basename = path.basename(fullpath);
        var destname = basename.replace(".jade", ".html");
        fs.writeFileSync(path.join(path.dirname(fullpath), destname), html);
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