// split-stream Copyright(c) 2013 sasa+1
// https://github.com/sasaplus1/split-stream
// Released under the MIT License.

var stream = require('stream'),
    stringdecoder = require('string_decoder').StringDecoder,
    util = require('util');

function SplitStream(options) {
  var splitStr;

  options.objectMode = true;
  options.decodeStrings = true;

  stream.Transform.call(this, options);

  splitStr = options.splitStr || /\r?\n/;
  if (typeof splitStr !== 'string' && !util.isRegExp(splitStr)) {
    throw new TypeError('splitStr should be a string or regexp. not ' +
        splitStr);
  }

  this.buffer_ = [];
  this.splits_ = [];
  this.decoder_ = new stringdecoder(options.encoding || 'utf8');
  this.splitStr_ = splitStr;
}

util.inherits(SplitStream, stream.Transform);

SplitStream.prototype._transform = function(chunk, encoding, callback) {
  var chunkStr = (this.buffer_.pop() || '') + this.decoder_.write(chunk),
      chunkArr = chunkStr.split(this.splitStr_);

  this.buffer_.push(chunkArr.pop());
  this.splits_ = this.splits_.concat(chunkArr);

  this.append_();
  callback(null);
};

SplitStream.prototype._flush = function(callback) {
  var chunkStr = this.buffer_.join('') + this.decoder_.end(),
      chunkArr = chunkStr.split(this.splitStr_);

  this.splits_ = this.splits_.concat(chunkArr);
  this.buffer_ = [];

  this.flushAll_(callback);
};

SplitStream.prototype.append_ = function() {
  var i, len, buf;

  for (i = 0, len = this.splits_.length; i < len; ++i) {
    buf = this.splits_.shift();

    if (!this.push(buf)) {
      this.splits_.unshift(buf);
      break;
    }
  }
};

SplitStream.prototype.flushAll_ = function(callback) {
  var that = this;

  this.append_();

  if (this.splits_.length > 0) {
    setImmediate(function() {
      that.flushAll_(callback);
    });
  } else {
    this.push(null);
    callback(null);
  }
};

module.exports = {
  create: function(options) {
    return new SplitStream(options || {});
  }
};
