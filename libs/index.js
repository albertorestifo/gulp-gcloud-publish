'use strict';

var gcloudStorage = require('@google-cloud/storage');
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
function getMetadata(file, metadata) {
  var meta = {
    contentType: mime.lookup(file.path)
  }

  // Check if it's gziped
  if (file.contentEncoding && file.contentEncoding.indexOf('gzip') > -1) {
    meta.contentEncoding = 'gzip';
  }

  if (metadata && metadata.cacheControl) {
      meta.cacheControl = metadata.cacheControl;
  }

  return meta;
}

/**
 * Normalize the path to save the file on GCS
 *
 * @param base - Base path
 * @param file - File to save
 * @return {string} - new relative path for GCS
 */
function normalizePath(base, file) {
  var _relative = file.path.replace(file.base, '');

  // ensure there is a trailing slash in the base path
  if (base && !/\/$/.test(base)) {
    base += '/';
  }

  // ensure the is no starting slash
  if (base && /^\//.test(base)) {
    base = base.replace(/^\//, '');
  }

  base = base || '';

  var newPath = base + _relative;

  return newPath.replace(/\\/g, "/");
}

/**
 * Log the file succesfully uploaded
 */
function logSuccess(gPath) {
  gutil.log('Uploaded', gutil.colors.cyan(gPath));
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
 * @param {Object} [options.metadata]   - Set the file metadata
 */
function gPublish(options) {
  // A configuration object is required
  if (!options || !options.bucket) {
    throw new PluginError(PLUGIN_NAME, 'Missing required configuration: bucket');
  }

  return through.obj(function(file, enc, done) {
    /* istanbul ignore next */
    if (file.isNull()) {
      return done(null, file);
    }

    file.path = file.path.replace(/\.gz$/, '');

    // Authenticate on Google Cloud Storage
    var storage = gcloudStorage({
      keyFilename: options.keyFilename,
      projectId: options.projectId
    });

    var bucket = storage.bucket(options.bucket);

    var gcPath = normalizePath(options.base, file);

    var metadata = getMetadata(file, options.metadata);

    var uploadOptions = {
      destination: options.transformDestination ? options.transformDestination(gcPath) : gcPath,
      metadata: metadata,
      gzip: !!options.gzip,
      public: !!options.public,
      resumable: !!options.resumable
    };

    file.pipe(
      bucket.file(uploadOptions.destination).createWriteStream(uploadOptions)
    )
      .on('error', function(e){
        throw new PluginError(PLUGIN_NAME, "Error in gcloud connection.\nError message:\n" + JSON.stringify(e));
      })
      .on('finish', function() {
        logSuccess(uploadOptions.destination);
        return done(null, file);
      });

  });
}

module.exports = gPublish;
