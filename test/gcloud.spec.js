'use strict';

/** Test dependencies */
var File = require('vinyl');
var _ = require('underscore');
var chai = require('chai');
var es = require('event-stream');
var rewire = require('rewire');
var sinon = require('sinon');
var through = require('through2');

var expect = chai.expect;
chai.should();

/** Tested module */
var gcloudStorage = rewire('../libs/');

describe('gulp-gcloud-publish', function() {
  /** Mock Gcloud */
  var gcloudStorageStub = sinon.stub();
  var bucketStub = sinon.stub();
  var fileStub = sinon.stub();
  var createWriteStreamStub = sinon.stub();

  gcloudStorageStub.returns({bucket: bucketStub});
  bucketStub.returns({file: fileStub});
  fileStub.returns({
    createWriteStream: createWriteStreamStub
  });

  function createFakeStream() {
    return through(function(chunk, enc, next) {
      this.push(chunk)
      next();
    });
  }

  gcloudStorage.__set__('gcloudStorage', gcloudStorageStub);

  var exampleConfig = {
    bucket: 'something',
  }

  it('should throw an error when missing configuration object', function() {
    expect(function() {
          return gcloudStorage()
        }).to.throw(/Missing required configuration/);
  });

  it('should throw an error when missing requred parameters', function() {
    function callWith(options) {
      return function() { return gcloudStorage(options); };
    }

    // missing bucket
    expect(callWith({})).to.throw(/Missing required configuration/);
  });

  it('should set the correct metadata', function(done) {
    createWriteStreamStub.returns(createFakeStream());
    var fakeFile = new File({
      contents: es.readArray(['stream', 'with', 'those', 'contents']),
      cwd: '/',
      base: '/test/',
      path: '/test/file.css'
    });

    var task = gcloudStorage(exampleConfig);

    task.write(fakeFile);
    task.on('data', function(file) {
      createWriteStreamStub.calledOnce.should.be.true;
      var metadata = createWriteStreamStub.args[0][0].metadata;
      metadata.should.have.all.keys({
        contentType: 'text/css'
      });

      done();
    })
    .on('error', done);
  });

  it('should recognise a gzip and make it public', function(done) {
    createWriteStreamStub.returns(createFakeStream());
    var fakeFile = new File({
      contents: es.readArray(['stream', 'with', 'those', 'contents']),
      cwd: '/',
      base: '/test/',
      path: '/test/file.css.gz'
    });

    fakeFile.contentEncoding = ['gzip'];

    var config = _.clone(exampleConfig);
    config.public = true;

    var task = gcloudStorage(config);

    task.write(fakeFile);
    task.on('data', function(file) {
      var uploadOptions = createWriteStreamStub.args[1][0];
      var metadata = uploadOptions.metadata;
      var publicOption = uploadOptions.public;

      metadata.should.have.all.keys({
        contentType: 'text/css',
        contentEncoding: 'gzip'
      });

      publicOption.should.be.true;

      file.path.should.not.match(/\.gz$/);

      done();
    })
    .on('error', done);
  });

  it('should be called with a bucket home path', function(done) {
    createWriteStreamStub.returns(createFakeStream());
    var fakeFile = new File({
      contents: es.readArray(['stream', 'with', 'those', 'contents']),
      cwd: '/',
      base: '/test/',
      path: '/test/file.css'
    });

    var task = gcloudStorage(exampleConfig);

    task.write(fakeFile);
    task.on('data', function() {
      fileStub.lastCall.calledWith('file.css').should.be.true;

      done();
    })
    .on('error', done);
  });

  it('should use the correct path when starting with a \/', function(done) {
    createWriteStreamStub.returns(createFakeStream());
    var fakeFile = new File({
      contents: es.readArray(['stream', 'with', 'those', 'contents']),
      cwd: '/',
      base: '/test/',
      path: '/test/file.css'
    });

    var config = _.clone(exampleConfig);
    config.base = '/test';
    var task = gcloudStorage(config);

    task.write(fakeFile);
    task.on('data', function() {
      fileStub.lastCall.calledWith('test/file.css').should.be.true;

      done();
    })
    .on('error', done);
  });

  it('should use the correct path when ending with a \/', function(done) {
    createWriteStreamStub.returns(createFakeStream());
    var fakeFile = new File({
      contents: es.readArray(['stream', 'with', 'those', 'contents']),
      cwd: '/',
      base: '/test/',
      path: '/test/file.css'
    });

    var config = _.clone(exampleConfig);
    config.base = 'test/';
    var task = gcloudStorage(config);

    task.write(fakeFile);
    task.on('data', function() {
      fileStub.lastCall.calledWith('test/file.css').should.be.true;

      done();
    })
    .on('error', done);
  });

  it('should use the correct path when starting and ending with a \/', function(done) {
    createWriteStreamStub.returns(createFakeStream());
    var fakeFile = new File({
      contents: es.readArray(['stream', 'with', 'those', 'contents']),
      cwd: '/',
      base: '/test/',
      path: '/test/file.css'
    });

    var config = _.clone(exampleConfig);
    config.base = '/test/';
    var task = gcloudStorage(config);

    task.write(fakeFile);
    task.on('data', function() {
      fileStub.lastCall.calledWith('test/file.css').should.be.true;

      done();
    })
    .on('error', done);
  });

});
