var tape = require('tape')
var skim = require('./')
var tests = require('./')
var abstractBlobTests = require('abstract-blob-store/tests')

var mem = require('abstract-blob-store')

var common = {
  setup: function(t, cb) {
    cb(null, skim(mem(), mem()))
  },
  teardown: function(t, store, blob, cb) {
    cb()
  }
}

abstractBlobTests(tape, common)

tape('skim', function(t) {
  var remote = mem()
  var blobs = skim(mem(), remote)

  var ws = remote.createWriteStream({key:'test'}, function() {
    blobs.createReadStream({key:'test'}).once('data', function(data) {
      t.same(data.toString(), 'h', 'data is on the remote')
      t.end()
    })
  })

  ws.end('h')
})

tape('skim exists', function(t) {
  var remote = mem()
  var blobs = skim(mem(), remote)

  var ws = remote.createWriteStream({key:'test'}, function() {
    blobs.exists({key:'test'}, function(err, exists) {
      t.notOk(err, 'no err')
      t.ok(exists, 'exists on the remote')
      t.end()
    })
  })

  ws.end('h')
})