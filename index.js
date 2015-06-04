var gcloud = require('gcloud');
var through = require('through2');
var gutil = require('gulp-util');
var mime = require('mime');

var PLUGIN_NAME = 'gulp-gcloud-publish';

module.exports = function(options) {
  options = options || {};

  return through.obj(function(file, enc, done) {
    // authentication options must be set
    if (!options.auth) {
      this.emit('error', new gutil.PluginError(PLUGIN_NAME,
          'Authentication options must be set'));
      return done();
    }

    // Check for empty file
    if (file.isNull()) { return done(); }

    var metadata = {};

    // Check if it's gziped
    if (file.contentEncoding && file.contentEncoding.indexOf('gzip') > -1) {
      // if the file path ends with `.gz`, remove it
      file.path = file.path.replace(/\.gz$/, '');

      metadata.contentEncoding = 'gzip';
    }

    metadata.contentType = mime.lookup(file.path);

    // Authenticate on Google Cloud Storage
    var storage = gcloud.storage({
      keyFilename: options.auth.keyFilename,
      projectId: options.auth.projectId
    });

    var bucket = storage.bucket(options.bucket);

    file.pipe(bucket.file(file.path).createWriteStream({
          metadata: metadata
        }))
        .on('error', function(err) {
          this.emit('error', err);
          return done();
        })
        .on('complete', done);

  });
}
