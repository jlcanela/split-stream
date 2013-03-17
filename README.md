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

### stream2

```js
var fs = require('fs'),
    splitStream = require('split-stream').SplitStream2,
    ss = splitStream.create();

ss.on('readable', function() {
  var buf;

  while ((buf = ss.read(1)) !== null) {
    console.log(buf);
  }
});
ss.on('end', function() {
  console.log('end');
});

fs.createReadStream('./index.js').pipe(ss);
```

### old-style stream

```js
var fs = require('fs'),
    splitStream = require('split-stream').SplitStream1,
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

## Class

### SplitStream

class of SplitStream1 or SplitStream2.

```js
var splitStream = require('split-stream');

// true if over version 0.9.
(splitStream === splitStream.SplitStream2);

// true if under version 0.8.
(splitStream === splitStream.SplitStream2);
```

---

### SplitStream2

inherited stream2 class.

## Function (SplitStream2)

### create(options)

* `` object - options object

* `return` SplitStream2 - SplitStream2

throw TypeError if options.splitStr is not string or regexp types.

objectMode and decodeStrings are always true.

#### options

* `splitStr` string or regexp - split string

default value is `/\r?\n/`.

* `encoding` string - encoding

default value is `utf8`. this value is argument of string_decoder.

---

### SplitStream1

inherited old-style stream class.

## Function (SplitStream1)

### create(options)

* `options` object - option object

* `return` SplitStream1 - SplitStream1

throw TypeError if options.splitStr is not string or regexp types.

#### options

* `splitStr` string or regexp - split string

default value is `/\r?\n/`.

## Events (SplitStream1)

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
