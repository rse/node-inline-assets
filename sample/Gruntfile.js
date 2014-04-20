
module.exports = function(grunt) {
    grunt.initConfig({
        "inline-assets": {
            options: {
                verbose: true
            },
            "sample": {
                files: [{
                    expand: true,
                    flatten: false,
                    cwd: "src",
                    src: "**/*.html",
                    dest: "dst"
                }]
            }
        },
        clean: {
            clean:     [ "dst" ],
            distclean: [ "node_modules" ]
        }
    });
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadTasks("../tasks");
    grunt.registerTask("default", [ "inline-assets" ]);
};

