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

/*  standard requirements  */
var fs       = require("fs");
var path     = require("path");

/*  extra requirements  */
var _        = require("lodash");
var datauri  = require("datauri/parser");
var htmlmin  = require("html-minifier").minify;
var CSSO     = require("csso");
var uglifyjs = require("uglify-js");

/*  generate regular expression for an XML simple tag  */
var reXMLTagSimple = function (name) {
    return new RegExp(
        "<(" + name + ")" +
        "((?:\\s+[a-zA-Z][a-zA-Z0-9-]*(?:=(?:\"[^\"]*\"|'[^']*'|\\S+))?)*)" +
        "\\s*(?:\\/>|>\\s*<\\/" + name + ">|>)", "g"
    );
};

/*  generate regular expression for an XML complex tag  */
var reXMLTagComplex = function (name) {
    return new RegExp(
        "<(" + name + ")" +
        "((?:\\s+[a-zA-Z][a-zA-Z0-9-]*(?:=(?:\"[^\"]*\"|'[^']*'|\\S+))?)*)" +
        "\\s*>(.*?)<\\/" + name + ">", "g"
    );
};

/*  parse attributes of a XML tag  */
var attrOfTag = function (tag) {
    var attr = {};
    tag.replace(/\s+([a-zA-Z][a-zA-Z0-9-]*)(?:=(?:"([^"]*)"|'([^']*)'|(\S+)))?/g,
        function (all, key, v1, v2, v3) {
            var val = (v1 !== undefined ? v1 : (v2 !== undefined ? v2 : (v3 !== undefined ? v3 : true)));
            attr[key] = (typeof val === "string" ? val.replace(/&quot;/, "\"").replace(/&amp;/g, "&") : val);
        }
    );
    return attr;
};

/*  generate an XML tag  */
var genXMLTag = function (name, attrs, body) {
    var tag = "<" + name;
    _.forEach(attrs, function (val, key) {
        if (val === true)
            tag += " " + key;
        else
            tag += " " + key + "=\"" + val.replace(/&/g, "&amp;").replace(/"/g, "&quot;") + "\"";
    });
    if (typeof body !== "undefined")
        tag += ">" + body + "</" + name + ">";
    else
        tag += "/>";
    return tag;
};

/*  cleanup an URL for use as a filename  */
var url2fn = function (url) {
    return url.replace(/\?.*$/, "").replace(/#.*$/, "");
};

/*  determine whether asset is processed in inlining process  */
var processAsset = function (options, filename) {
    var pattern = options.pattern;
    var processIt = (pattern[0].substr(0, 1) === "!" ? true : false);
    for (var i = 0; i < pattern.length; i++) {
        var negate = false;
        var regex = pattern[i];
        if (regex.substr(0, 1) === "!") {
            negate = true;
            regex = regex.substr(1);
        }
        regex = new RegExp(regex);
        if (filename.match(regex))
            processIt = !negate;
    }
    return processIt;
};

/*  send caller verbose information  */
var verbose = function (options, action, type, filename, lenBefore, lenAfter) {
    if (typeof options.verbose === "function")
        options.verbose(action, type, filename, lenBefore, lenAfter);
};

/*  inline assets of a piece of arbitrary data  */
var inlineAssetsForData = function (basename, filename, content, options) {
    var len = content.length;
    verbose(options, "expanding", "DATA", filename, len, -1);
    content = (new datauri()).format(filename, content).content;
    verbose(options, "expanded", "DATA", filename, len, content.length);
    return content;
};

/*  inline assets of a piece of JavaScript  */
var inlineAssetsForJS = function (basename, filename, content, options) {
    var len = content.length;
    verbose(options, "expanding", "JS", filename, len, -1);
    if (options.jsmin) {
        var len2 = content.length;
        verbose(options, "minifying", "JS", filename, len2, -1);
        content = uglifyjs.minify(content, { fromString: true, mangle: false });
        verbose(options, "minifying", "JS", filename, len2, content.length);
    }
    verbose(options, "expanded", "JS", filename, len, content.length);
    return content;
};

/*  inline assets of a piece of CSS  */
var inlineAssetsForCSS = function (basename, filename, content, options) {
    var len = content.length;
    verbose(options, "expanding", "CSS", filename, len, -1);
    var reURL1 = "@import\\s+" +
        "(?:" +
        "url\\((?:\"([^\"]*)\"|'([^']*)'|(\\S+?))\\)|" +
        "(?:\"([^\"]*)\"|'([^']*)')" +
        ")" +
        "(\\s+[^;\\r\\n]+)?" +
        "\\s*;";
    var reURL2 = "\\b" +
        "url\\((?:\"([^\"]*)\"|'([^']*)'|(\\S+?))\\)" +
        "(?:\\s*format\\((?:\"([^\"]*)\"|'([^']*)'|(\\S+?))\\))?" +
        "(\\s*,)?";
    content = content.replace(new RegExp(reURL1, "g"),
        function (stmt, v1, v2, v3, v4, v5, media) {
            var fn = (v1 !== undefined ? v1 : (v2 !== undefined ? v2 : (v3 !== undefined ? v3 : (v4 !== undefined ? v4 : v5))));
            if (!fn.match(/^(?:data|https?):/)) {
                fn = path.resolve(path.dirname(filename), url2fn(fn));
                if (processAsset(options, fn)) {
                    var css = fs.readFileSync(fn, { encoding: "utf8" });
                    css = inlineAssetsForCSS(path.dirname(filename), fn, css, options); /*  RECURSION!  */
                    if (typeof media === "string")
                        css = "@media" + media + " {" + css + "}";
                    stmt = css;
                }
                else if (options.purge)
                    stmt = "";
            }
            return stmt;
        }
    );
    content = content.replace(new RegExp(reURL2, "g"), function (stmt, v1, v2, v3, f1, f2, f3, epilog) {
        var fn = (v1 !== undefined ? v1 : (v2 !== undefined ? v2 : v3));
        var fm = (f1 !== undefined ? f1 : (f2 !== undefined ? f2 : f3));
        if (!fn.match(/^(?:data|https?):/)) {
            fn = path.resolve(path.dirname(filename), url2fn(fn));
            if (processAsset(options, fn)) {
                var data = fs.readFileSync(fn, { encoding: null });
                data = inlineAssetsForData(filename, fn, data, options);
                stmt = "url(\"" + data + "\")";
                if (fm)
                    stmt += " format(\"" + fm + "\")";
                if (epilog)
                    stmt += epilog;
            }
            else if (options.purge)
                stmt = "";
        }
        return stmt;
    });
    if (options.cssmin) {
        var len2 = content.length;
        verbose(options, "minifying", "CSS", filename, len2, -1);
        content = CSSO.minify(content, {
            restructure: false,
            sourceMap:   false
        }).css;
        verbose(options, "minifyed", "CSS", filename, len2, content.length);
    }
    verbose(options, "expanded", "CSS", filename, len, content.length);
    return content;
};

/*  inline assets of a piece of HTML  */
var inlineAssetsForHTML = function (basename, filename, content, options) {
    var len = content.length;
    verbose(options, "expanding", "HTML", filename, len, -1);
    content = content.replace(reXMLTagSimple("script"), function (tag, name, attrs) {
        var attr = attrOfTag(attrs);
        if (   typeof attr.type === "undefined"
            || attr.type === "text/javascript"
            || (typeof attr.src === "string" && attr.src.match(/\.js/i))) {
            if (typeof attr.src === "string" && !attr.src.match(/^(?:data|https?):/)) {
                var fn = path.resolve(path.dirname(filename), url2fn(attr.src));
                if (processAsset(options, fn)) {
                    var js = fs.readFileSync(fn, { encoding: "utf8" });
                    js = inlineAssetsForJS(path.dirname(filename), fn, js, options);
                    delete attr.src;
                    tag = genXMLTag("script", attr, js);
                }
            }
        }
        return tag;
    });
    content = content.replace(reXMLTagSimple("link"), function (tag, name, attrs) {
        var attr = attrOfTag(attrs);
        if (   attr.rel  === "stylesheet"
            || attr.type === "text/css"
            || (typeof attr.href === "string" && attr.href.match(/\.css$/i))) {
            if (typeof attr.href === "string" && !attr.href.match(/^(?:data|https?):/)) {
                var fn = path.resolve(path.dirname(filename), url2fn(attr.href));
                if (processAsset(options, fn)) {
                    var css = fs.readFileSync(fn, { encoding: "utf8" });
                    css = inlineAssetsForCSS(path.dirname(filename), fn, css, options);
                    if (typeof attr.media !== "undefined")
                        css = "@media " + attr.media + " {" + css + " }";
                    tag = genXMLTag("style", { type: "text/css" }, css);
                }
            }
        }
        return tag;
    });
    content = content.replace(reXMLTagComplex("style"), function (tag, name, attrs, body) {
        var attr = attrOfTag(attrs);
        if (   typeof attr.type === "undefined"
            || attr.type === "text/css"        ) {
            body = inlineAssetsForCSS(basename, filename, body, options);
            tag = genXMLTag("style", { type: "text/css" }, body);
        }
        return tag;
    });
    content = content.replace(reXMLTagSimple("img"), function (tag, name, attrs) {
        var attr = attrOfTag(attrs);
        var fn;
        if (typeof attr.src === "string" && !attr.src.match(/^(?:data|https?):/)) {
            if (attr.src.match(/\.(?:png|gif|jpe?g|svg)$/i)) {
                fn = path.resolve(path.dirname(filename), url2fn(attr.src));
                if (processAsset(options, fn)) {
                    var data = fs.readFileSync(fn);
                    data = inlineAssetsForData(filename, fn, data, options);
                    attr.src = data;
                    tag = genXMLTag("img", attr);
                }
            }
        }
        return tag;
    });
    if (options.htmlmin) {
        var len2 = content.length;
        verbose(options, "minifying", "HTML", filename, len2, -1);
        content = htmlmin(content, {
            removeComments:     true,
            collapseWhitespace: true
        });
        verbose(options, "minifyed", "HTML", filename, len2, content.length);
    }
    verbose(options, "expanded", "HTML", filename, len, content.length);
    return content;
};

/*  inline assets of an arbitrary piece  */
var inlineAssets = function (basename, filename, content, options) {
    /*  provide option defaults  */
    if (typeof options.cssmin === "undefined")
        options.cssmin = false;
    if (typeof options.htmlmin === "undefined")
        options.htmlmin = false;
    if (typeof options.jsmin === "undefined")
        options.jsmin = false;
    if (typeof options.pattern === "undefined")
        options.pattern = [ ".+" ];
    if (typeof options.purge === "undefined")
        options.purge = false;

    /*  dispatch according to file extension  */
    if (filename.match(/\.html?$/i))
        return inlineAssetsForHTML(basename, filename, content, options);
    else if (filename.match(/\.css$/i))
        return inlineAssetsForCSS(basename, filename, content, options);
    else if (filename.match(/\.js$/i))
        return inlineAssetsForJS(basename, filename, content, options);
    else
        return inlineAssetsForData(basename, filename, content, options);
};

/*  export the packing API function  */
module.exports = inlineAssets;

