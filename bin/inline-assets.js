#!/usr/bin/env node
/*
**  node-inline-assets -- Inline External Assets of HTML/CSS Files
**  Copyright (c) 2014-2020 Dr. Ralf S. Engelschall <http://engelschall.com>
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

/*  standard requirements  */
var fs       = require("fs");
var path     = require("path");
var util     = require("util");

/*  extra requirements  */
var pkg      = require("package");
var dashdash = require("dashdash");
var sprintf  = require("sprintfjs");
var prettyb  = require("pretty-bytes");
var chalk    = require("chalk");

/*  internal requirements  */
var inlineAssets = require("../lib/inline-assets.js");

/*  gracefully die  */
var die = function (msg) {
    console.error("inline-assets: ERROR: ", msg);
    process.exit(1);
};

/*  command-line argument parsing  */
var options = [
    {   names: [ "version", "V" ], type: "bool", "default": false,
        help: "Print tool version and exit." },
    {   names: [ "help", "h" ], type: "bool", "default": false,
        help: "Print this help and exit." },
    {   names: [ "verbose", "v" ], type: "bool", "default": false,
        help: "Print verbose processing information." },
    {   names: [ "htmlmin" ], type: "bool", "default": false,
        help: "Minify processed HTML content (with html-minifier)." },
    {   names: [ "cssmin" ], type: "bool", "default": false,
        help: "Minify processed CSS content (with clean-css)." },
    {   names: [ "jsmin" ], type: "bool", "default": false,
        help: "Minify processed JavaScript content (with uglify-js)." },
    {   names: [ "pattern" ], type: "string", "default": ".+",
        help: "Comma-separated list of positive/negative filename regex patterns", helpArg: "PATTERNS" },
    {   names: [ "purge" ], type: "bool", "default": false,
        help: "Purge HTML/CSS/JavaScript references of files excluded by pattern." }
];
var parser = dashdash.createParser({
    options: options,
    interspersed: false
});
try {
    var opts = parser.parse(process.argv);
    var args = opts._args;
} catch (e) {
    die(e.message);
}
if (opts.help) {
    var help = parser.help().trimRight();
    console.log("inline-assets: USAGE: inline-assets [options] arguments\n" + "options:\n" + help);
    process.exit(0);
}
else if (opts.version) {
    var p = pkg(module);
    console.log(util.format("%s %s", p.name, p.version));
    process.exit(0);
}
if (args.length < 1 || args.length > 2) {
    console.log("inline-assets: ERROR: invalid number of arguments (use \"--help\" for details)");
    process.exit(1);
}

/*  determine source and destination files  */
var src = path.resolve(args[0]);
var dst;
if (args.length === 2)
   dst = path.resolve(args[1]);
else
   dst = process.cwd();

/*  read source file  */
var content = fs.readFileSync(src, { encoding: "utf8" });

/*  inline all external assets  */
var len_before = content.length;
content = inlineAssets(dst, src, content, {
    htmlmin: opts.htmlmin,
    cssmin:  opts.cssmin,
    jsmin:   opts.jsmin,
    pattern: opts.pattern.split(/,/),
    purge:   opts.purge,
    verbose: function (action, type, filename, lenBefore, lenAfter) {
        if (opts.verbose) {
            if (lenAfter > -1) {
                filename = path.relative(process.cwd(), filename);
                var msg = "++ " + sprintf("%-10s", action + ":") + " " +
                    chalk.blue(sprintf("%-5s", type + ":")) + " " +
                    filename +  ": " +
                    chalk.red(prettyb(lenBefore)) + " → " + chalk.green(prettyb(lenAfter)) +
                    "\n";
                process.stderr.write(msg);
            }
        }
    }
});

if (opts.verbose) {
    var len_after = content.length;
    process.stderr.write("++ input:  " + chalk.red(sprintf("%8d", len_before)) + " bytes\n");
    process.stderr.write("++ output: " + chalk.green(sprintf("%8d", len_after)) + " bytes\n");
}

/*  write destination file  */
if (args.length === 2)
    fs.writeFileSync(dst, content, { encoding: "utf8" });
else
    process.stdout.write(content);

