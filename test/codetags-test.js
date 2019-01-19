'use strict';

var assert = require('chai').assert;
var envmask = require('envmask').instance;
var codetags = require('../lib/codetags');

describe('codetags', function() {
  before(function() {
  });
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
      assert.isTrue(codetags.isEnabled('abc'));
      assert.isFalse(codetags.isEnabled('disabled'));
      assert.isFalse(codetags.isEnabled('nil'));
    })
  });
  describe('isEnabled()', function() {
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
      assert.isTrue(codetags.isEnabled('abc'));
      assert.isTrue(codetags.isEnabled('abc', 'xyz'));
      assert.isTrue(codetags.isEnabled('abc', 'disabled'));
      assert.isTrue(codetags.isEnabled('disabled', 'abc'));
      assert.isTrue(codetags.isEnabled('abc', 'nil'));
      assert.isTrue(codetags.isEnabled('undefined', 'abc', 'nil'));
      assert.isFalse(codetags.isEnabled());
      assert.isFalse(codetags.isEnabled('disabled'));
      assert.isFalse(codetags.isEnabled('nil'));
      assert.isFalse(codetags.isEnabled('nil', 'disabled'));
      assert.isFalse(codetags.isEnabled('nil', 'disabled', 'abc.xyz'));
    })
    it('An array argument presents the AND conditional operator', function() {
      assert.isTrue(codetags.isEnabled(['abc', 'xyz'], 'nil'));
      assert.isTrue(codetags.isEnabled(['abc', 'xyz'], null));
      assert.isFalse(codetags.isEnabled(['abc', 'nil']));
      assert.isFalse(codetags.isEnabled(['abc', 'def', 'nil']));
      assert.isFalse(codetags.isEnabled(['abc', 'def', 'disabled']));
      assert.isFalse(codetags.isEnabled(['abc', '123'], ['def', '456']));
    })
    it('pre-defined tags are overridden by values of environment variables', function() {
      assert.isTrue(codetags.isEnabled('abc'));
      assert.isTrue(codetags.isEnabled('tag-1'));
      assert.isTrue(codetags.isEnabled('abc', 'tag-1'));
      assert.isTrue(codetags.isEnabled('disabled', 'tag-1'));
      assert.isTrue(codetags.isEnabled('tag-4'));
      assert.isFalse(codetags.isEnabled('tag-2'));
      assert.isFalse(codetags.isEnabled('tag-3'));
      assert.isFalse(codetags.isEnabled(['nil', 'tag-1']));
      assert.isFalse(codetags.isEnabled('nil', 'tag-3'));
      assert.isFalse(codetags.isEnabled('tag-3', 'disabled'));
    })
  });
  after(function() {
    envmask.reset();
    codetags.reset();
  });
});
