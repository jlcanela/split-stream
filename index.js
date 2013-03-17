// split-stream Copyright(c) 2013 sasa+1
// https://github.com/sasaplus1/split-stream
// Released under the MIT License.

var hasTransform = (!!require('stream').Transform);

module.exports =
    (hasTransform) ?
    require('./lib/split_stream2') :
    require('./lib/split_stream');

module.exports.SplitStream1 = require('./lib/split_stream');
module.exports.SplitStream2 =
    (hasTransform) ?
    require('./lib/split_stream2') :
    null;
