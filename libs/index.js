'use strict';

var gcloud = require('gcloud');
var gutil = require('gulp-util');
var mime = require('mime');
var through = require('through2');

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
  if (
    file.contentEncoding && file.contentEncoding.indexOf('gzip') > -1 ||
    /\.gz$/.test(file.path)) {
    _meta.contentEncoding = 'gzip';
  }

  return _meta;
}

/**
 * Normalize the path to save the file on GCS
 *
 * @param base - Base path
 * @param file - File to save
 */
function normalizePath(base, file) {
  var _relative = file.path.replace(file.base, '');

  // ensure there is a tailing slash in the base path
  if (base && !/\/$/.test(base)) {
    base += '/';
  }

  // ensure the is no starting slash
  if (base && /^\//.test(base)) {
    base = base.replace(/^\//, '');
  }

  base = base || '';
  return base + _relative;
}

/**
 * Log the file succesfully uploaded
 */
function logSuccess(gPath) {
  gutil.log('Upladed', gutil.colors.cyan(gPath));
}

/**
 * Upload a file stream to Google Cloud Storage
 *
 * @param {Object}  options
 * @param {String}  options.bucket      - Name of the bucket we want to upload the file into
 * @param {String}  options.keyFilename - Full path to the KeyFile JSON
 * @param {String}  options.projectId   - Project id
 * @param {String}  [options.base='/']  - Base path for saving the file
 * @param {Boolean} [options.public]    - Set the file as public
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

    var metadata = getMetadata(file);
    file.path = file.path.replace(/\.gz$/, '');

    // Authenticate on Google Cloud Storage
    var storage = gcloud.storage({
      keyFilename: options.keyFilename,
      projectId: options.projectId
    });

    var bucket = storage.bucket(options.bucket);

    var gcPah = normalizePath(options.base, file);

    var gcFile = bucket.file(gcPah);

    file.pipe(gcFile.createWriteStream({metadata: metadata}))
        .on('error', done)
        .on('complete', function() {
          if (options.public) {
            return gcFile.makePublic(function(err) {
              logSuccess(gcPah);
              done(err, file);
            });
          }

          logSuccess(gcPah);
          return done(null, file);
        });

  });
}

module.exports = gPublish;
