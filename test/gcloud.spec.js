'use strict';

/** Test dependencies */
var File = require('vinyl');
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
  var makePublicStub = sinon.stub();

  var gcloudMock = {
    storage: storageStub
  }

  storageStub.returns({bucket: bucketStub});
  bucketStub.returns({file: fileStub});
  fileStub.returns({
    createWriteStream: createWriteStreamStub,
    makePublic: makePublicStub
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

  createWriteStreamStub.returns(createFakeStream());
  makePublicStub.returns(function(cb) { cb(); })

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
    var fakeFile = new File({
      contents: es.readArray(['stream', 'with', 'those', 'contents']),
      cwd: '/',
      base: '/test/',
      path: '/test/file.css.gz',
      public: true
    });

    var task = gcloud(exampleConfig);

    task.write(fakeFile);
    task.on('data', function(file) {
      createWriteStreamStub.calledOnce.should.be.true;
      var metadata = createWriteStreamStub.args[0][0].metadata;
      metadata.should.have.all.keys({
        contentType: 'text/css',
        contentEncoding: 'gzip'
      });

      makePublicStub.calledOnce.should.be.true;

      file.path.should.not.match(/\.gz$/);

      done();
    })
    .on('error', done);
  });

});
