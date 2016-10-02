
Node-Inline-Assets
==================

[Node](http://nodejs.org/) API, CLI and Grunt Task
for inlining external assets of HTML/CSS files.

<p/>
<img src="https://nodei.co/npm/inline-assets.png?downloads=true&stars=true" alt=""/>

<p/>
<img src="https://david-dm.org/rse/node-inline-assets.png" alt=""/>

Abstract
--------

This is a [Node](http://nodejs.org/) Application Programming Interface
(API), Command-Line Interface (CLI) and Grunt Task for inlining all
external assets of HTML/CSS files. The purpose of this approach is
to either reduce the number of required HTTP requests for HTML5
Single-Page-Apps (SPA) or to simply bundle a stand-alone HTML document
with all its external assets for easier distribution.

Installation
------------

Use the Node Package Manager (NPM) to install this module
locally (default) or globally (with option `-g`):

    $ npm install [-g] inline-assets

Usage
-----

### Command-Line Interface (CLI)

```sh
$ inline-assets \
  [--verbose] \
  [--htmlmin] [--cssmin] [--jsmin] \
  [--pattern <filename-regex>] \
  [--purge] \
  <source-file> [<destination-file>]
```

### Grunt Build Process

```js
grunt.initConfig({
    "inline-assets": {
        options: {
            verbose: false,
            htmlmin: false,
            cssmin:  false,
            jsmin:   false,
            pattern: [ ".+" ],
            purge:   false
        },
        "example": {
            src:  "<source-file>",
            dest: "<destination-file>"
        },
        [...]
    },
    [...]
})
```

### Application Programming Interface (API)

```js
var fs = require("fs")
var inlineAssets = require("inline-assets")
var content = fs.readFileSync("<source-file>", "utf8")
content = inlineAssets("<destination-file>", "<source-file>", content, {
    verbose: false,
    htmlmin: false,
    cssmin:  false,
    jsmin:   false,
    pattern: [ ".+" ],
    purge:   false
})
fs.writeFileSync("<destination-file>", content, "utf8")
```

Options
-------

The processing options are:

- `verbose`: Print verbose processing information.
- `htmlmin`: Minify processed HTML content (with `html-minifier`).
- `cssmin`:  Minify processed CSS content (with `clean-css`).
- `jsmin`:   Minify processed JavaScript content (with `uglify-js`).
- `pattern`: Comma-separated list of positive/negative filename regex patterns.
- `purge`:   Purge HTML/CSS/JavaScript references of files excluded by pattern.

License
-------

Copyright (c) 2014-2016 Ralf S. Engelschall (http://engelschall.com/)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

