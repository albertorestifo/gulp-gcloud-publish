'use strict';

var assert = require('assert')
var stubs = require('./')

var tests = []

test('is a function', function() {
  assert.equal(typeof stubs, 'function')
})

test('throws without obj || method', function() {
  assert.throws(function() {
    stubs()
  }, /must provide/)

  assert.throws(function() {
    stubs({})
  }, /must provide/)
})

test('stubs a method with a noop', function() {
  var originalCalled = false

  var obj = {}
  obj.method = function() {
    originalCalled = true
  }

  stubs(obj, 'method')

  obj.method()

  assert(!originalCalled)
})

test('accepts an override', function() {
  var originalCalled = false

  var obj = {}
  obj.method = function() {
    originalCalled = true
  }

  var replacementCalled = false
  stubs(obj, 'method', function() {
    replacementCalled = true
  })

  obj.method()
  assert(!originalCalled)
  assert(replacementCalled)
})

test('calls through to original method', function() {
  var originalCalled = false

  var obj = {}
  obj.method = function() {
    originalCalled = true
  }

  var replacementCalled = false
  stubs(obj, 'method', { callthrough: true }, function() {
    replacementCalled = true
  })

  obj.method()
  assert(originalCalled)
  assert(replacementCalled)
})

test('stops calling stub after n calls', function() {
  var timesToCall = 5
  var timesCalled = 0

  var obj = {}
  obj.method = function() {
    assert.equal(timesCalled, timesToCall)
  }

  stubs(obj, 'method', { calls: timesToCall }, function() {
    timesCalled++
  })

  obj.method() // 1 (stub)
  obj.method() // 2 (stub)
  obj.method() // 3 (stub)
  obj.method() // 4 (stub)
  obj.method() // 5 (stub)
  obj.method() // 6 (original)
})

test('calls stub in original context of obj', function() {
  var secret = 'brownies'

  function Class() {
    this.method = function() {}
    this.secret = secret
  }

  var cl = new Class()

  stubs(cl, 'method', function() {
    assert.equal(this.secret, secret)
  })

  cl.method()
})

function test(message, fn) {
  try {
    fn()
    tests.push({ success: true, fail: false, message: message })
  } catch(e) {
    tests.push({ success: false, fail: true, message: message, error: e })
  }
}

tests.forEach(function(test, index) {
  function black(message) {
    return '\u001b[30m' + message + '\u001b[39m'
  }
  function greenBg(message) {
    return '\u001b[42m' + message + '\u001b[49m'
  }
  function redBg(message) {
    return '\u001b[41m' + message + '\u001b[49m'
  }
  function bold(message) {
    return '\u001b[1m' + message + '\u001b[22m'
  }

  var icon, message
  if (test.success) {
    icon = '✔︎'
    message = greenBg(black(' ' + icon + ' ' + test.message + ' '))
  } else {
    icon = '✖'
    message = redBg(bold(' ' + icon + ' ' + test.message + ' '))
  }

  console.log((index > 0 ? '\n' : '') + message)
  if (test.error) {
    console.log('  ' + test.error.stack)
  }
})