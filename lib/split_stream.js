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
  this.decoder_ = new stringdecoder;

  splitStr = options.splitStr || /\r?\n/;
  if (typeof splitStr !== 'string' && !util.isRegExp(splitStr)) {
    throw new TypeError('splitStr should be a string or regexp: ' + splitStr);
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
};

SplitStream.prototype.write = function(chunk, encoding) {
  var that = this,
      chunkStr, localDecoder, splitArr, sliceStr;

  if (this.ended_) {
    this.emit('error', new Error('SplitStream ended'));
    this.readable = false;
    this.writable = false;
    return false;
  }

  if (encoding) {
    localDecoder = new stringdecoder(encoding);
  }

  chunkStr = (localDecoder || this.decoder_).write(chunk);
  splitArr = chunkStr.split(this.splitStr_);
  sliceStr = (this.buffer_.pop() || '') + splitArr.shift();

  this.buffer_.push(sliceStr);
  this.buffer_ = this.buffer_.concat(splitArr);

  process.nextTick(function() {
    that.tick_();
  });

  return false;
};

SplitStream.prototype.end = function(chunk, encoding) {
  if (chunk) {
    this.write(chunk, encoding);
  }
  this.ended_ = true;
};

SplitStream.prototype.tick_ = function() {
  var that = this;

  if (this.ended_ && this.buffer_.length <= 0) {
    this.emit('end');
    this.readable = false;
    this.writable = false;
    return;
  }

  process.nextTick(function() {
    that.tick_();
  });

  if (this.paused_) {
    return;
  }

  if (this.buffer_.length > 0) {
    this.emit('data', this.buffer_.shift());
  } else {
    this.emit('drain');
  }
};

module.exports = {
  create: function(options) {
    return new SplitStream(options || {});
  }
};
