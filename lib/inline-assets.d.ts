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

declare module "inline-assets" {
    /*  inline external assets of HTML/CSS source file  */
    function inlineAssets (
        /*  name of destination file  */
        destinationFile: string,
        /*  name of source file  */
        sourceFile:      string,
        /*  content of source file  */
        content:         string,
        /*  processing options  */
        options: {
            /*  Print verbose processing information  */
            verbose: boolean,
            /*  Minify processed HTML content (with `html-minifier`)  */
            htmlmin: boolean,
            /*  Minify processed CSS content (with `csso`)  */
            cssmin:  boolean,
            /*  Minify processed JavaScript content (with `uglify-js`).  */
            jsmin:   boolean,
            /*  Comma-separated list of positive/negative filename regex patterns.  */
            pattern: string[],
            /*  Purge HTML/CSS/JavaScript references of files excluded by pattern.  */
            purge:   boolean
        }
    ): string
    export default inlineAssets
}

