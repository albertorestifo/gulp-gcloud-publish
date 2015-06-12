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
var gcloud = rewire('../libs/');

describe('gulp-gcloud-publish', function() {
  /** Mock Gcloud */
  var storageStub = sinon.stub();
  var bucketStub = sinon.stub();
  var fileStub = sinon.stub();
  var createWriteStreamStub = sinon.stub();

  var gcloudMock = {
    storage: storageStub
  }

  var makePublicCallCount = 0;

  storageStub.returns({bucket: bucketStub});
  bucketStub.returns({file: fileStub});
  fileStub.returns({
    createWriteStream: createWriteStreamStub,
    makePublic: function(cb) {
      makePublicCallCount += 1;
      cb();
    }
  });

  function createFakeStream() {
    return through(function(chunk, enc, next) {
      this.push(chunk)
      next();
    })
    .on('data', function() {})
    .on('end', function() {
      this.emit('complete');
    });

  }

  gcloud.__set__('gcloud', gcloudMock);

  var exampleConfig = {
    bucket: 'something',
    projectId: 'some-id',
    keyFilename: '/path/to/something.json'
  }

  it('should throw an error when missing configuration object', function() {
    expect(function() {
          return gcloud()
        }).to.throw(/Missing configurations object/);
  });

  it('should throw an error when missing requred parameters', function() {
    function callWith(options) {
      return function() { return gcloud(options); };
    }

    // missing projectId
    expect(callWith({
      bucket: true,
      keyFilename: true
    })).to.throw(/Missing required configuration params/);

    // missing keyFilename
    expect(callWith({
      bucket: true,
      projectId: true
    })).to.throw(/Missing required configuration params/);

    // missing bucket
    expect(callWith({
      projectId: true,
      keyFilename: true
    })).to.throw(/Missing required configuration params/);
  });

  it('should set the correct metadata', function(done) {
    createWriteStreamStub.returns(createFakeStream());
    var fakeFile = new File({
      contents: es.readArray(['stream', 'with', 'those', 'contents']),
      cwd: '/',
      base: '/test/',
      path: '/test/file.css'
    });

    var task = gcloud(exampleConfig);

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
    makePublicCallCount = 0;
    var fakeFile = new File({
      contents: es.readArray(['stream', 'with', 'those', 'contents']),
      cwd: '/',
      base: '/test/',
      path: '/test/file.css.gz'
    });

    fakeFile.contentEncoding = ['gzip'];

    var config = _.clone(exampleConfig);
    config.public = true;

    var task = gcloud(config);

    task.write(fakeFile);
    task.on('data', function(file) {
      var metadata = createWriteStreamStub.args[1][0].metadata;
      metadata.should.have.all.keys({
        contentType: 'text/css',
        contentEncoding: 'gzip'
      });

      makePublicCallCount.should.equal(1);

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

    var task = gcloud(exampleConfig);

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
    var task = gcloud(config);

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
    var task = gcloud(config);

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
    var task = gcloud(config);

    task.write(fakeFile);
    task.on('data', function() {
      fileStub.lastCall.calledWith('test/file.css').should.be.true;

      done();
    })
    .on('error', done);
  });

});
