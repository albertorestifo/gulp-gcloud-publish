var gcloud = require('gcloud');
var through = require('through2');
var gutil = require('gulp-util');
var mime = require('mime');

var PLUGIN_NAME = 'gulp-gcloud-publish';
var PluginError = gutil.PluginError;

/**
 * Get the file metadata
 *
 * @private
 * @param {File} file
 */
function getMetadata(file) {
  var _meta = {
    contentType: mime.lookup(file.path)
  }

  // Check if it's gziped
  if (file.contentEncoding && file.contentEncoding.indexOf('gzip') > -1) {
    _meta.contentEncoding = 'gzip';
  }

  return _meta;
}

/**
 * Upload a file stream to Google Cloud Storage
 *
 * @param {Object}  options
 * @param {String}  options.bucket         - Name of the bucket we want to upload the file into
 * @param {String}  options.keyFilename   - Full path to the KeyFile JSON
 * @param {String}  options.projectId     - Project id
 * @param {Boolean} [options.public] - Set the file as public
 */
function gPublish(options) {
  // A configuration object is required
  if (!options) {
    throw new PluginError(PLUGIN_NAME, 'Missing configurations object!');
  }
  // And most of the keys also are
  if (!options.bucket || !options.keyFilename || !options.projectId) {
    throw new PluginError(PLUGIN_NAME, 'Missing required configuration params');
  }

  return through.obj(function(file, enc, done) {
    if (file.isNull()) { done(null, file); }

    // remove the `.gz` if present
    file.path = file.path.replace(/\.gz$/, '');

    var metadata = getMetadata(file);

    // Authenticate on Google Cloud Storage
    var storage = gcloud.storage({
      keyFilename: options.keyFilename,
      projectId: options.projectId
    });

    var bucket = storage.bucket(options.bucket);

    var gcFile = bucket.file(file.path);

    file.pipe(gcFile.createWriteStream({metadata: metadata}))
        .on('error', done)
        .on('complete', function() {
          if (options.public) {
            return gcFile.makePublic(function(err) {
              done(err, file);
            });
          }

          return done(null, file);
        });

  });
}

module.exports = gPublish;
