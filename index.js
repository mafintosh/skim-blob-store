var pump = require('pump')
var duplexify = require('duplexify')
var debug = require('debug')('skim-blob-store')

var Skim = function(backend, remote) {
  if (!(this instanceof Skim)) return new Skim(backend, remote)
  this.backend = backend
  this.remote = remote
}

Skim.prototype.createReadStream = function(obj) {
  var backend = this.backend
  var remote = this.remote
  var dup = duplexify()

  dup.setWritable(false)

  backend.exists(obj, function(err, exists) {
    if (err) return dup.destroy(err)

    if (exists) debug('createReadStream from local')
    else debug('createReadStream copying from remote')

    if (exists) return dup.setReadable(backend.createReadStream(obj))

    // copy remote blob into the local backend
    pump(remote.createReadStream(obj), backend.createWriteStream(obj, function(err, meta) {
      if (err) return dup.destroy(err)
      dup.setReadable(backend.createReadStream(meta))
    }), function(err) {
      if (err) return dup.destroy(err) // in case the backend doesn't do destroy
    })
  })

  return dup
}

Skim.prototype.createWriteStream = function() {
  return this.backend.createWriteStream.apply(this.backend, arguments)
}

Skim.prototype.exists = function(obj, cb) {
  var backend = this.backend
  var remote = this.remote

  backend.exists(obj, function(err, exists) {
    if (err) return cb(err)
    if (exists) return cb(null, exists)
    remote.exists(obj, cb)
  })
}

module.exports = Skim