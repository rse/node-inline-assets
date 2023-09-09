/*
**  node-inline-assets -- Inline External Assets of HTML/CSS Files
**  Copyright (c) 2014-2023 Dr. Ralf S. Engelschall <http://engelschall.com>
**
**  Permission is hereby granted, free of charge, to any person obtaining
**  a copy of this software and associated documentation files (the
**  "Software"), to deal in the Software without restriction, including
**  without limitation the rights to use, copy, modify, merge, publish,
**  distribute, sublicense, and/or sell copies of the Software, and to
**  permit persons to whom the Software is furnished to do so, subject to
**  the following conditions:
**
**  The above copyright notice and this permission notice shall be included
**  in all copies or substantial portions of the Software.
**
**  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
**  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
**  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
**  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
**  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
**  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
**  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/* global module:  false */
/* global require: false */
/* global process: false */

/*  standard requirements  */
var path     = require("path");

/*  external requirements  */
var sprintf  = require("sprintfjs");
var prettyb  = require("pretty-bytes");
var chalk    = require("chalk");

/*  internal requirements  */
var inlineAssets = require("../lib/inline-assets.js");

/*  export the Grunt plugin  */
module.exports = function (grunt) {
    /*  define the Grunt task  */
    grunt.registerMultiTask("inline-assets", "Inline External Assets of HTML/CSS Files", function () {
        /*  prepare task options  */
        var options = this.options({
            htmlmin:  false,
            cssmin:   false,
            jsmin:    false,
            pattern:  [ ".+" ],
            purge:    false
        });
        grunt.verbose.writeflags(options, "Options");

        /*  iterate over all src-dest file pairs  */
        this.files.forEach(function (f) {
            f.src.forEach(function (src) {
                if (!grunt.file.exists(src))
                    throw "source file \"" + chalk.red(src) + "\" not found.";
                else {
                    /*  determine destination path  */
                    var dest = f.dest;
                    if (grunt.file.isDir(dest))
                        dest = path.join(dest, path.basename(src));

                    /*  read source file  */
                    var content = grunt.file.read(src);

                    /*  inline all external assets  */
                    content = inlineAssets(dest, src, content, {
                        htmlmin: options.htmlmin,
                        cssmin:  options.cssmin,
                        jsmin:   options.jsmin,
                        pattern: options.pattern,
                        purge:   options.purge,
                        verbose: function (action, type, filename, lenBefore, lenAfter) {
                            if (lenAfter > -1) {
                                filename = path.relative(process.cwd(), filename);
                                var msg = sprintf("%-10s", action + ":") + " " +
                                    chalk.blue(sprintf("%-5s", type + ":")) + " " +
                                    filename +  ": " +
                                    chalk.red(prettyb(lenBefore)) + " → " + chalk.green(prettyb(lenAfter));
                                grunt.log.writeln(msg);
                            }
                        }
                    });

                    /*  write destination  */
                    grunt.file.write(dest, content);
                    grunt.log.writeln("File \"" + chalk.green(dest) + "\" created.");
                }
            });
        });
    });
};

