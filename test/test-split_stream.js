var assert = require('assert'),
    splitStream = require('../');

suite('split-streamのテスト', function() {

  suite('コンストラクタのテスト', function() {

    test('引数を渡さずに生成できること', function() {
      var ss;

      assert.doesNotThrow(function() {
        ss = new splitStream.create();
      }, TypeError, 'splitStream.create should not be threw TypeError');
      assert.strictEqual(ss.splitStr_.source, '\\r?\\n',
          'splitStr_ should be has /\\r?\\n/');
    });

    test('splitStrに文字列・正規表現を渡して生成できること', function() {
      var ss;

      assert.doesNotThrow(function() {
        ss = new splitStream.create({
          splitStr: '\\n'
        });
      }, TypeError, 'splitStream.create should not be threw TypeError');
      assert.strictEqual(ss.splitStr_, '\\n',
          'splitStr_ should be has "\\n"');

      assert.doesNotThrow(function() {
        ss = new splitStream.create({
          splitStr: /[\r\n\t]/
        });
      }, TypeError, 'splitStream.create should not be threw TypeError');
      assert.strictEqual(ss.splitStr_.source, '[\\r\\n\\t]',
          'splitStr_ should be has /[\\r\\n\\t]/');
    });

    test('splitStrに文字列・正規表現以外を渡して例外が投げられること', function() {
      assert.throws(function() {
        new splitStream.create({ splitStr: 1 });
      }, 'splitStr should be a string or regexp: 1',
      'create({ splitStr: 1 }) should be threw TypeError');
      assert.throws(function() {
        new splitStream.create({ splitStr: true });
      }, 'splitStr should be a string or regexp: true',
      'create({ splitStr: true }) should be threw TypeError');
      assert.throws(function() {
        new splitStream.create({ splitStr: function() {} });
      }, 'splitStr should be a string or regexp: function () {}',
      'create({ splitStr: function() {} }) should be threw TypeError');
    });

  });

  suite('destroyメソッドのテスト', function() {

    var ss;

    setup(function() {
      ss = splitStream.create();
    });

    teardown(function() {
      ss = null;
    });

    test('closeイベントが送信されること', function(done) {
      ss.on('close', function() {
        done();
      });
      ss.destroy();
    });

    test('二重に実行するとerrorイベントが送信されること', function(done) {
      ss.on('error', function(err) {
        assert.strictEqual(err.message, 'SplitStream closed',
            'call twice destroy() should be sent error event');
        done();
      });
      ss.destroy();
      ss.destroy();
    });

  });

  suite('writeメソッドのテスト', function() {

    var ss;

    setup(function() {
      ss = splitStream.create();
    });

    teardown(function() {
      ss = null;
    });

    test('分割した単位ごとにdataイベントを送信すること', function(done) {
      var fs = require('fs'),
          lines = [];

      ss.on('data', function(data) {
        lines.push(data);
      });
      ss.on('end', function() {
        fs.readFile(__filename, 'utf8', function(err, data) {
          assert.strictEqual(lines.join('\n'), data,
              'write() should be sent data event per lines');
          done();
        });
      });
      fs.createReadStream(__filename).pipe(ss);
    });

    test('endが呼ばれた後はerrorイベントを送信すること', function(done) {
      ss.on('error', function(err) {
        assert.strictEqual(err.message, 'SplitStream ended',
            'write() after end() should be sent error event');
        done();
      });
      ss.end();
      ss.write();
    });

  });

});
