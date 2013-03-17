var assert = require('assert'),
    fs = require('fs'),
    splitStream = require('../').SplitStream2;

suite('split-stream - stream2のテスト', function() {

  // no test if node.js version under 0.8
  if (splitStream === null) {
    return test('stream2 is not implemented.');
  }

  suite('コンストラクタのテスト', function() {

    test('引数を渡さずに生成できること', function() {
      var ss;

      assert.doesNotThrow(function() {
        ss = splitStream.create();
      }, TypeError, 'splitStream.create() should not be threw TypeError');
      assert.strictEqual(ss.splitStr_.source, '\\r?\\n',
          'splitStr_ should be has /\\r?\\n/');
    });

    test('splitStrに文字列・正規表現を渡して生成できること', function() {
      var ss;

      assert.doesNotThrow(function() {
        ss = splitStream.create({
          splitStr: '\\n'
        });
      }, TypeError, 'splitStream.create() should not be threw TypeError');
      assert.strictEqual(ss.splitStr_, '\\n',
          'splitStr_ should be has "\\n"');

      assert.doesNotThrow(function() {
        ss = splitStream.create({
          splitStr: /[\r\n\t]/
        });
      }, TypeError, 'splitStream.create() should not be threw TypeError');
      assert.strictEqual(ss.splitStr_.source, '[\\r\\n\\t]',
          'splitStr_ should be has /[\\r\\n\\t]/');
    });

    test('splitStrに文字列・正規表現以外を渡して例外が投げられること',
        function() {
          assert.throws(function() {
            splitStream.create({ splitStr: 1 });
          }, 'splitStr should be a string or regexp. not 1',
          'create({ splitStr: 1 }) should be threw TypeError');
          assert.throws(function() {
            splitStream.create({ splitStr: true });
          }, 'splitStr should be a string or regexp. not true',
          'create({ splitStr: true }) should be threw TypeError');
          assert.throws(function() {
            splitStream.create({ splitStr: function() {} });
          }, 'splitStr should be a string or regexp. not function () {}',
          'create({ splitStr: function() {} }) should be threw TypeError');
        });

  });

  suite('write/endメソッドのテスト', function() {

    test('writeとendで渡された引数を分割できること', function(done) {
      var ss = splitStream.create({ splitStr: ',' }),
          src = '1,2,3,4,5,6,',
          items = [];

      ss.on('readable', function() {
        var data;

        while ((data = ss.read(1)) !== null) {
          items.push(data);
        }
      });
      ss.on('end', function() {
        assert.deepEqual(items, ['1', '2', '3', '4', '5', '6', ''],
            'SplitStream should be sent data event per commas');
        done();
      });

      src.split('').forEach(function(value) {
        ss.write(value);
      });
      ss.end();
    });

    test('区切り文字がない場合でも分割できること', function(done) {
      var ss = splitStream.create({ splitStr: ':' }),
          src = '12345',
          lines = [];

      ss.on('readable', function() {
        var data;

        while ((data = ss.read(1)) !== null) {
          lines.push(data);
        }
      });
      ss.on('end', function() {
        assert.deepEqual(lines, ['12345'],
            'SplitStream should be sent data event per split string');
        done();
      });

      ss.end(src);
    });

  });

  suite('pipeメソッドのテスト', function() {

    test('pipeで渡されて分割できること', function(done) {
      var ss = splitStream.create(),
          lines = [];

      ss.on('readable', function() {
        var data;

        while ((data = ss.read(1)) !== null) {
          lines.push(data);
        }
      });
      ss.on('end', function() {
        fs.readFile(__filename, 'utf8', function(err, data) {
          assert.strictEqual(lines.join('\n'), data,
              'SplitStream should be sent data event per lines');
          done();
        });
      });

      fs.createReadStream(__filename).pipe(ss);
    });

    test('512バイトずつpipeで渡されて分割できること', function(done) {
      var ss = splitStream.create(),
              lines = [];

      ss.on('readable', function() {
        var data;

        while ((data = ss.read(1)) !== null) {
          lines.push(data);
        }
      });
      ss.on('end', function() {
        fs.readFile(__filename, 'utf8', function(err, data) {
          assert.strictEqual(lines.join('\n'), data,
              'SplitStream should be sent data event per lines');
          done();
        });
      });

      fs.createReadStream(__filename, {
        highWaterMark: 512
      }).pipe(ss);
    });

    test('32バイトずつpipeで渡されて分割できること', function(done) {
      var ss = splitStream.create(),
              lines = [];

      ss.on('readable', function() {
        var data;

        while ((data = ss.read(1)) !== null) {
          lines.push(data);
        }
      });
      ss.on('end', function() {
        fs.readFile(__filename, 'utf8', function(err, data) {
          assert.strictEqual(lines.join('\n'), data,
              'SplitStream should be sent data event per lines');
          done();
        });
      });

      fs.createReadStream(__filename, {
        highWaterMark: 32
      }).pipe(ss);
    });

    test('1バイトずつpipeで渡されて分割できること', function(done) {
      var ss = splitStream.create(),
              lines = [];

      ss.on('readable', function() {
        var data;

        while ((data = ss.read(1)) !== null) {
          lines.push(data);
        }
      });
      ss.on('end', function() {
        fs.readFile(__filename, 'utf8', function(err, data) {
          assert.strictEqual(lines.join('\n'), data,
              'SplitStream should be sent data event per lines');
          done();
        });
      });

      fs.createReadStream(__filename, {
        highWaterMark: 1
      }).pipe(ss);
    });
  });

});
