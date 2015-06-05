'use strict';

/** Test dependencies */
var chai = require('chai');
var rewire = require('rewire');
var sinon = require('sinon');

var expect = chai.expect;
chai.should();

/** Tested module */
var gcloud = rewire('../libs/');

describe('gulp-gcloud-publish', function() {
  /** Mock Gcloud */
  var gcloudMock = {
    storage: function() {
      return {
        bucket: function() {
          return {
            file: function() {
              return {
                createWriteStream: function() {

                },
                makePublic: function() {

                }
              }
            }
          }
        }
      }
    }
  }
  gcloud.__set__('gcloud', gcloudMock);
});
