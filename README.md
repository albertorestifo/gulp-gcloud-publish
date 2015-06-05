# gulp-gcloud-publish

[![NPM](https://img.shields.io/npm/v/gulp-gcloud-publish.svg?style=flat-square)](https://www.npmjs.com/package/gulp-gcloud-publish)


> Upload files to Google Cloud Storage with Gulp

## Install

```
npm install --save-dev gulp-gcloud-publish
```

## Usage

First, you need to create your Google Cloud API credentials. [__Official Docs__][gc-docs].

The plugin takes a configuration object with the following keys:

- bucket `String`: Name of the bucket where we want to upload the file
- keyFilename `String`: Full path to the Google Cloud API keyfile ([docs][gc-docs])
- projectId `String`: Google Cloud Project ID ([docs][gc-docs])
- base `String`: base path to use in the bucket, default to `/`
- public `Bollean` (optional): If set to true, marks the uploaded file as public

## Example

The plugins works best with [gulp-gzip](https://www.npmjs.com/package/gulp-gzip).

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
        public: true
      })); // => File will be uploaded to /bucket-name/css/example.css
});
```

## To Do

- Write spec tests __Help Wanted__

[gc-docs]: https://googlecloudplatform.github.io/gcloud-node/#/authorization
