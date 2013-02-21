var assert = require('assert'),
    fs = require('fs'),
    splitStream = require('../');

suite('split-streamのテスト', function() {

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

  suite('destroyメソッドのテスト', function() {

    test('closeイベントが送信されること', function(done) {
      var ss = splitStream.create();

      ss.on('close', function() {
        done();
      });

      ss.destroy();
    });

    test('二度destroyを呼ぶとerrorイベントが送信されること', function(done) {
      var ss = splitStream.create();

      ss.on('error', function(err) {
        assert.strictEqual(err.message, 'SplitStream closed',
            'call twice destroy() should be sent error event');
        done();
      });

      ss.destroy();
      ss.destroy();
    });

  });

  suite('write/endメソッドのテスト', function() {

    test('endの後にwriteを呼ぶとerrorイベントが送信されること', function(done) {
      var ss = splitStream.create();

      ss.on('error', function(err) {
        assert.strictEqual(err.message, 'SplitStream ended',
            'write() after end() should be sent error event');
        done();
      });

      ss.end();
      ss.write();
    });

    test('writeとendで渡された引数を分割できること', function(done) {
      var ss = splitStream.create({ splitStr: ',' }),
          src = '1,2,3,4,5,6,',
          items = [];

      ss.on('data', function(data) {
        items.push(data);
      });
      ss.on('end', function() {
        assert.deepEqual(items, ['1', '2', '3', '4', '5', '6', ''],
            'SplitStream should be sent data event per commas');
        done();
      });

      src.split('').forEach(function(value) {
        ss.write(value);
        ss.resume();
      });
      ss.end();
    });

    test('writeで引数を渡さずendに引数を渡して分割できること', function(done) {
      var ss = splitStream.create({ splitStr: ':' }),
          src = '1:2:3:4:5:',
          lines = [];

      ss.on('data', function(data) {
        lines.push(data);
      });
      ss.on('end', function() {
        assert.deepEqual(lines, ['1', '2', '3', '4', '5', ''],
            'SplitStream should be sent data event per corons');
        done();
      });

      ss.write('');
      ss.resume();
      ss.write('');
      ss.resume();
      ss.write('');
      ss.resume();
      ss.end(src);
    });

  });

  suite('pause/resumeメソッドのテスト', function() {

    test('pause後にwriteし、resumeして出力されること', function(done) {
      var ss = splitStream.create(),
          lines = [];

      ss.on('data', function(data) {
        lines.push(data);
      });
      ss.on('end', function() {
        assert.deepEqual(lines, ['a', 'ab', 'bc\rc'],
            'SplitStream should be sent data event per lines');
        done();
      });

      ss.pause();

      ss.write('a\na');
      ss.write('b\r\nb');
      ss.write('c\rc');
      assert.deepEqual(lines, [],
          'SplitStream should not be sent data event');

      ss.resume();
      ss.end();
    });

    test('pauseとresumeを繰り返して出力されること', function(done) {
      var ss = splitStream.create(),
          lines = [];

      ss.on('data', function(data) {
        lines.push(data);
      });
      ss.on('end', function() {
        assert.deepEqual(lines, ['aa', 'bbcc', 'dd', 'ee', '', 'end', ''],
            '');
        done();
      });

      ss.pause();
      ss.write('aa\nbb');
      ss.resume();
      ss.pause();
      ss.write('cc\r\ndd');
      ss.resume();
      ss.pause();
      ss.write('\nee\r\n\r\n');
      ss.resume();
      ss.pause();
      ss.end('end\n');
      ss.resume();
    });

    test('pause後にdestroyを呼び、出力されないこと', function(done) {
      var ss = splitStream.create(),
          lines = [];

      ss.on('data', function(data) {
        lines.push(data);
      });
      ss.on('close', function() {
        assert.deepEqual(lines, [],
            'SplitStream should be not sent data event');
        done();
      });

      ss.pause();
      ss.write('aaa\n');
      ss.write('bbb\n');
      ss.write('ccc\n');
      ss.end();
      ss.destroy();
    });

  });

  suite('pipeメソッドのテスト', function() {

    test('pipeで渡されて分割できること', function(done) {
      var ss = splitStream.create(),
          lines = [];

      ss.on('data', function(data) {
        lines.push(data);
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

      ss.on('data', function(data) {
        lines.push(data);
      });
      ss.on('end', function() {
        fs.readFile(__filename, 'utf8', function(err, data) {
          assert.strictEqual(lines.join('\n'), data,
              'SplitStream should be sent data event per lines');
          done();
        });
      });

      fs.createReadStream(__filename, {
        bufferSize: 512
      }).pipe(ss);
    });

    test('32バイトずつpipeで渡されて分割できること', function(done) {
      var ss = splitStream.create(),
              lines = [];

      ss.on('data', function(data) {
        lines.push(data);
      });
      ss.on('end', function() {
        fs.readFile(__filename, 'utf8', function(err, data) {
          assert.strictEqual(lines.join('\n'), data,
              'SplitStream should be sent data event per lines');
          done();
        });
      });

      fs.createReadStream(__filename, {
        bufferSize: 32
      }).pipe(ss);
    });

    test('1バイトずつpipeで渡されて分割できること', function(done) {
      var ss = splitStream.create(),
              lines = [];

      ss.on('data', function(data) {
        lines.push(data);
      });
      ss.on('end', function() {
        fs.readFile(__filename, 'utf8', function(err, data) {
          assert.strictEqual(lines.join('\n'), data,
              'SplitStream should be sent data event per lines');
          done();
        });
      });

      fs.createReadStream(__filename, {
        bufferSize: 1
      }).pipe(ss);
    });
  });

});
