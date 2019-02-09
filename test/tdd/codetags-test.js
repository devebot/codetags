'use strict';

var assert = require('chai').assert;
var envmask = require('envmask').instance;
var codetags = require('../../lib/codetags');

describe('codetags', function() {

  describe('initialize()', function() {
    before(function() {
      codetags.reset().initialize({
        namespace: 'Devebot',
        positiveTagsLabel: 'UPGRADE_ENABLED',
        negativeTagsLabel: 'UPGRADE_DISABLED',
      });
    })
    beforeEach(function() {
      envmask.setup({
        DEVEBOT_UPGRADE_ENABLED: "abc, def, xyz",
        DEVEBOT_UPGRADE_DISABLED: "disabled",
      })
      codetags.clearCache();
    })
    it('customized namespace is used to retrieve values of environment variables', function() {
      assert.isTrue(codetags.isActive('abc'));
      assert.isFalse(codetags.isActive('disabled'));
      assert.isFalse(codetags.isActive('nil'));
    })
  });

  describe('isActive()', function() {
    before(function() {
      codetags.reset().register([
        {
          name: "tag-1"
        },
        {
          label: "tag-2",
          enabled: true,
        },
        {
          tag: "tag-3",
          enabled: false,
        },
        {
          name: "tag-4",
          enabled: false,
        }
      ]);
    })
    beforeEach(function() {
      envmask.setup({
        CODETAGS_POSITIVE_TAGS: "abc, def, xyz, tag-4",
        CODETAGS_NEGATIVE_TAGS: "disabled, tag-2",
      })
      codetags.clearCache();
    })
    it('An arguments-list presents the OR conditional operator', function() {
      assert.isTrue(codetags.isActive('abc'));
      assert.isTrue(codetags.isActive('abc', 'xyz'));
      assert.isTrue(codetags.isActive('abc', 'disabled'));
      assert.isTrue(codetags.isActive('disabled', 'abc'));
      assert.isTrue(codetags.isActive('abc', 'nil'));
      assert.isTrue(codetags.isActive('undefined', 'abc', 'nil'));
      assert.isFalse(codetags.isActive());
      assert.isFalse(codetags.isActive(null));
      assert.isFalse(codetags.isActive(null, undefined));
      assert.isFalse(codetags.isActive('disabled'));
      assert.isFalse(codetags.isActive('nil'));
      assert.isFalse(codetags.isActive('nil', 'disabled'));
      assert.isFalse(codetags.isActive('nil', 'disabled', 'abc.xyz'));
    })
    it('An array argument presents the AND conditional operator', function() {
      assert.isTrue(codetags.isActive(['abc', 'xyz'], 'nil'));
      assert.isTrue(codetags.isActive(['abc', 'xyz'], null));
      assert.isFalse(codetags.isActive(['abc', 'nil']));
      assert.isFalse(codetags.isActive(['abc', 'def', 'nil']));
      assert.isFalse(codetags.isActive(['abc', 'def', 'disabled']));
      assert.isFalse(codetags.isActive(['abc', '123'], ['def', '456']));
    })
    it('pre-defined tags are overridden by values of environment variables', function() {
      assert.isTrue(codetags.isActive('abc'));
      assert.isTrue(codetags.isActive('tag-1'));
      assert.isTrue(codetags.isActive('abc', 'tag-1'));
      assert.isTrue(codetags.isActive('disabled', 'tag-1'));
      assert.isTrue(codetags.isActive('tag-4'));
      assert.isFalse(codetags.isActive('tag-2'));
      assert.isFalse(codetags.isActive('tag-3'));
      assert.isFalse(codetags.isActive(['nil', 'tag-1']));
      assert.isFalse(codetags.isActive('nil', 'tag-3'));
      assert.isFalse(codetags.isActive('tag-3', 'disabled'));
    });
  });

  describe('getInstance()', function() {
    it('should return the default instance', function() {
      assert.equal(codetags, codetags.getInstance('codetags'));
      assert.equal(codetags, codetags.getInstance('CodeTags'));
    });
    it('should create an unexisted instance', function() {
      const mytags = codetags.getInstance('unexisted');
      assert.isObject(mytags);
      assert.notEqual(codetags, mytags);
    });
    it('should throw an error if provided name is not a string', function() {
      assert.throws(function() {
        codetags.getInstance();
      }, 'name of a codetags instance must be a string');
      assert.throws(function() {
        codetags.getInstance(1024);
      }, 'name of a codetags instance must be a string');
    });
  });

  describe('newInstance()', function() {
    it('should throw an error if provided name is not a string', function() {
      assert.throws(function() {
        codetags.newInstance();
      }, 'name of a codetags instance must be a string');
      assert.throws(function() {
        codetags.newInstance(1024);
      }, 'name of a codetags instance must be a string');
    });
    it('should throw an error if provided name is equal to default name', function() {
      assert.throws(function() {
        codetags.newInstance('codetags');
      }, 'CODETAGS is default instance name. Please provides another name.');
    });
    it('should create and return a new instance', function() {
      const codetags1 = codetags.newInstance('example');
      const codetags2 = codetags.newInstance('example');
      const codetags3 = codetags.getInstance('example');
      assert.notEqual(codetags, codetags1);
      assert.notEqual(codetags, codetags2);
      assert.notEqual(codetags1, codetags2);
      assert.equal(codetags2, codetags3);
    });
  });

  after(function() {
    envmask.reset();
    codetags.reset();
  });
});
