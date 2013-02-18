# split-stream  [![Build Status](https://travis-ci.org/sasaplus1/split-stream.png)](https://travis-ci.org/sasaplus1/split-stream)

stream of split strings

## Installation

```sh
$ npm install split-stream
```

## Usage

```js
var fs = require('fs'),
    splitStream = require('split-stream'),
    ss = splitStream.create();

fs.createReadStream('./file').pipe(ss).pipe(process.stdout);
```

```js
var fs = require('fs'),
    splitStream = require('split-stream'),
    ss = splitStream.create({
      splitStr: '\t'
    });

ss.setEncoding('utf8');

ss.on('data', function(data) {
  console.log(data);
});
ss.on('end', function() {
  ss.destory();
});
ss.on('close', function() {
  console.log('close');
});

fs.createReadStream('./file').pipe(ss);
```

## Function

### create(options)

* `options` object - option object

* `return` SplitStream - SplitStream

throw TypeError if options.splitStr is not string or regexp types.

#### options

* `splitStr` string or regexp - split string

default value is `/\r?\n/`.

## Events

### close

called destroy().

### data

* `data` string - split string

until buffer is empty.

### drain

when buffer is empty.

### end

call after end() and when buffer is empty.

### error

* `error` Error - error object

call twice destory() or call write() after end().

## Test

```sh
$ npm install
$ npm test
```

## License

The MIT License. Please see LICENSE file.
