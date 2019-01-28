'use strict';

var assert = require('chai').assert;
var envmask = require('envmask').instance;
var codetags = require('../../lib/codetags');

describe('codetags', function() {

  describe('initialize()', function() {
    before(function() {
      codetags.reset().initialize({
        namespace: 'Devebot',
        POSITIVE_TAGS: 'UPGRADE_ENABLED',
        NEGATIVE_TAGS: 'UPGRADE_DISABLED',
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

  after(function() {
    envmask.reset();
    codetags.reset();
  });
});
