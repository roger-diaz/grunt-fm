'use strict';

var spawn = require('child_process').spawn;
var iconv = require("iconv-lite");
var path = require("path");

var jarFile = path.join(__dirname, "../jar/fm.jar");

var processTemplate = function(args) {
  var settings = JSON.stringify(args.settings);
  var resultData = "";

  var cmd = spawn('java', ["-jar", jarFile,
      settings,
      args.template,
      args.page]);

  if(args.callback) {
    cmd.stdout.on("data", function(data) {
      
      resultData += iconv.decode(data, settings.encoding);
    });
    cmd.stderr.on("data", function(data) {
      
      console.log(iconv.decode(data, settings.encoding));
    });
    cmd.stdout.on("end", function() {
      args.callback(null, resultData);
    });
  }
};

module.exports = function(grunt) {

  grunt.registerMultiTask('fm', 'Freemarker renderer plugin for grunt.', function() {

    var count = 0;
    var done = this.async();

    var options = this.options({
      views: "views",
      out: this.data.out || "public",
      encoding: this.data.encoding || "utf-8",
      data: "data"
    });

    var publicFolder = path.resolve(options.out);

    this.files.forEach(function(f) {

        f.src.filter(function(filepath) {
          
          if (!grunt.file.exists(filepath)) {
            grunt.log.warn('Mock file "' + filepath + '" not found.');
            return false;
          } else {
            return true;
          }
        }).map(function(filepath) {

          var file = path.resolve(filepath);

          delete require.cache[require.resolve(file)];
          var controller = require(file);

          var controllers = [];

          controllers = controllers.concat(controller);

          controllers.forEach(function(ctrl) {
            count++;
            var destFile = path.join(publicFolder, ctrl.out || ctrl.view.replace(path.extname(ctrl.view),".html") );

             

            
            processTemplate({
              settings: {
                encoding: options.encoding,
                templatesDir: path.resolve(options.views),
                modelDir: path.join(path.dirname(file), options.data);
              },
              template: ctrl.view,
              page: path.parse(file).name,
              callback: function(err, result) {
                count--;
                if(err) {
                  grunt.log.warn('Process Mock file' + filepath + '" error!');
                  done(false);
                  return false;
                }

                grunt.file.write(destFile, result);
                grunt.log.writeln('File "' + destFile + '" created.');
                if (count < 1){
                  done(true);
                }
              }
            });


          });

        });

      });
  });

};
