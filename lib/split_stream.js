// split-stream Copyright(c) 2013 sasa+1
// https://github.com/sasaplus1/split-stream
// Released under the MIT License.

var stream = require('stream'),
    stringdecoder = require('string_decoder').StringDecoder,
    util = require('util');

function SplitStream(options) {
  var splitStr;

  stream.call(this);

  this.readable = true;
  this.writable = true;

  this.paused_ = false;
  this.closed_ = false;
  this.ended_ = false;

  this.buffer_ = [];
  this.splits_ = [];
  this.decoder_ = new stringdecoder;

  splitStr = options.splitStr || /\r?\n/;
  if (typeof splitStr !== 'string' && !util.isRegExp(splitStr)) {
    throw new TypeError('splitStr should be a string or regexp. not ' +
        splitStr);
  }

  this.splitStr_ = splitStr;
}

util.inherits(SplitStream, stream);

SplitStream.prototype.destroy = function() {
  if (this.closed_) {
    this.emit('error', new Error('SplitStream closed'));
    this.readable = false;
    this.writable = false;

    return;
  }

  this.emit('close');
  this.closed_ = true;
  this.readable = false;
  this.writable = false;
};

SplitStream.prototype.setEncoding = function(encoding) {
  this.decoder_ = new stringdecoder(encoding);
};

SplitStream.prototype.pause = function() {
  this.paused_ = true;
};

SplitStream.prototype.resume = function() {
  this.paused_ = false;
  this.tick_();
};

SplitStream.prototype.write = function(chunk, encoding) {
  var decoder;

  if (this.ended_) {
    this.emit('error', new Error('SplitStream ended'));
    this.readable = false;
    this.writable = false;

    return false;
  }

  if (encoding) {
    decoder = new stringdecoder(encoding);
  }

  this.merge_(
      (decoder || this.decoder_).write(chunk));

  return true;
};

SplitStream.prototype.end = function(chunk, encoding) {
  if (chunk) {
    this.write(chunk, encoding);
  }

  this.ended_ = true;
  this.tick_();
};

SplitStream.prototype.tick_ = function() {
  var that = this,
      i, len;

  if (this.ended_) {
    if (this.buffer_.length > 0) {
      this.flush_();
    }

    if (this.splits_.length <= 0) {
      this.readable && this.writable && this.emit('end');
      this.readable = false;
      this.writable = false;

      return;
    }
  }

  for (i = 0, len = this.splits_.length; i < len; ++i) {
    process.nextTick(function() {
      that.send_();
    });
  }
};

SplitStream.prototype.send_ = function() {
  var splits = this.splits_;

  if (this.paused_ || this.closed_) {
    return;
  }

  if (this.ended_) {
    this.tick_();
  }

  if (splits.length > 0) {
    this.emit('data', splits.shift());
  } else {
    this.emit('drain');
  }
};

SplitStream.prototype.merge_ = function(decodedChunk) {
  var buffer = this.buffer_,
      splits = this.splits_,
      chunkStr = (buffer.pop() || '') + decodedChunk,
      chunkArr = chunkStr.split(this.splitStr_);

  buffer.push(chunkArr.pop());
  this.splits_ = splits.concat(chunkArr);
};

SplitStream.prototype.flush_ = function() {
  var buffer = this.buffer_,
      splits = this.splits_,
      chunks = buffer.join('').split(this.splitStr_);

  this.splits_ = splits.concat(chunks);
  this.buffer_ = [];
};

module.exports = {
  create: function(options) {
    return new SplitStream(options || {});
  }
};
