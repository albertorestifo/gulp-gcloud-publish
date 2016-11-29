'use strict';

var gcloud = require('gcloud');
var gutil = require('gulp-util');
var mime = require('mime');
var through = require('through2');
var fs = require('fs');

var PLUGIN_NAME = 'gulp-gcloud-publish';
var PluginError = gutil.PluginError;

/**
 * Get the file metadata
 *
 * @private
 * @param {File} file
 */
function getMetadata(file) {
  var meta = {
    contentType: mime.lookup(file.path)
  }

  // Check if it's gziped
  if (file.contentEncoding && file.contentEncoding.indexOf('gzip') > -1) {
    meta.contentEncoding = 'gzip';
  }

  return meta;
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
  gutil.log('Uploaded', gutil.colors.cyan(gPath));
}

/**
 * Log the file succesfully made public
 */
function logPublic(gPath) {
  gutil.log('Made public', gutil.colors.cyan(gPath));
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
    throw new PluginError(PLUGIN_NAME, 'Missing configuration object!');
  }
  // And most of the keys also are
  if (!options.bucket || !options.keyFilename || !options.projectId) {
    throw new PluginError(PLUGIN_NAME, 'Missing required configuration params');
  }

  return through.obj(function(file, encoding, done) {

    var metadata = getMetadata(file);

    // Authenticate on Google Cloud Storage
    var storage = gcloud.storage({
      keyFilename: options.keyFilename,
      projectId: options.projectId
    });

    var bucket = storage.bucket(options.bucket);

    // get the filename
    var fileToUpload = file.history[0];
    // set the basename for the remote file
    var fileRemote = fileToUpload.replace(file.base, '');
    // if the file is NOT an directory, upload it
    if(fs.lstatSync(fileToUpload).isDirectory() === false){
      // set upload object
      var uploadOptions = { destination: fileRemote };
      // return the done callback when uploaded
      return bucket.upload(fileToUpload, uploadOptions, function(err, uploadedFile) {
        // Make public if needed
        if(options.public){
            return uploadedFile.makePublic(function(){
              logSuccess(fileRemote);
              logPublic(fileRemote);
              return done();
            });
        } else {
          // Debug info
          logSuccess(fileRemote);
          if (!err) {
            return done();
          }
        }
      });
    } else {
      // if it is a directory, directly return the done callback
      return done();
    }
  });
}

module.exports = gPublish;
