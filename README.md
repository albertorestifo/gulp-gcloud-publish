# gulp-gcloud-publish

[![NPM](https://img.shields.io/npm/v/gulp-gcloud-publish.svg?style=flat-square)](https://www.npmjs.com/package/gulp-gcloud-publish) [![Build Status](https://img.shields.io/travis/albertorestifo/gulp-gcloud-publish.svg?style=flat-square)](https://travis-ci.org/albertorestifo/gulp-gcloud-publish) [![Code Coverage](https://img.shields.io/coveralls/albertorestifo/gulp-gcloud-publish.svg?style=flat-square)](https://coveralls.io/r/albertorestifo/gulp-gcloud-publish) [![Code Quality](https://img.shields.io/codeclimate/github/albertorestifo/gulp-gcloud-publish.svg?style=flat-square)](https://codeclimate.com/github/albertorestifo/gulp-gcloud-publish) [![Dependencies Status](https://img.shields.io/david/albertorestifo/gulp-gcloud-publish.svg?style=flat-square)](https://david-dm.org/albertorestifo/gulp-gcloud-publish)

> Upload files to Google Cloud Storage with Gulp

## Install

```
npm install --save-dev gulp-gcloud-publish
```

## Usage

First, you need to create your Google Cloud API credentials. [__Official Docs__][gc-docs].

The plugin takes a configuration object with the following keys:

- bucket `String`: Name of the bucket where we want to upload the file
- gzip `Boolean` (optional): Let Google automatically gzip and mark metadata of your file. Regardless of this setting, already-gzipped files will have metadata properly set.
- keyFilename `String`: Full path to the Google Cloud API keyfile ([docs][gc-docs])
- projectId `String`: Google Cloud Project ID ([docs][gc-docs])
- base `String`: base path to use in the bucket, default to `/`
- public `Boolean` (optional): If set to true, marks the uploaded file as public
- resumable `Boolean` (optional): Should be set to true for large files (>10Mb). Default is `false`.
- transformDestination `Function` (optional): Manipulates the final destination of the file in the bucket.

## Example

If you would like to `gzip` the files, the plugin works best with [gulp-gzip](https://www.npmjs.com/package/gulp-gzip).

```js
var gulp = require('gulp');
var gcPub = require('gulp-gcloud-publish');
var gzip = require('gulp-gzip'); // optional

gulp.task('publish', function() {

  return gulp.src('public/css/example.css')
      .pipe(gzip()) // optional
      .pipe(gcPub({
        bucket: 'bucket-name',
        keyFilename: 'path/to/keyFile.json',
        projectId: 'my-project-id',
        base: '/css',
        public: true,
        transformDestination: function(path) {
          return path.toLowerCase();
        },
        metadata: {
            cacheControl: 'max-age=315360000, no-transform, public',
        }
      })); // => File will be uploaded to /bucket-name/css/example.css
});
```

[gc-docs]: https://googlecloudplatform.github.io/gcloud-node/#/authorization
