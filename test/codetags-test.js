'use strict';

var assert = require('chai').assert;
var path = require('path');
var util = require('util');
var envmask = require('envmask').instance;
var codetags = require('../lib/codetags');

describe('codetags', function() {
  before(function() {
  });
  describe('isEnabled()', function() {
    beforeEach(function() {
      envmask.setup({
        CODETAGS_UPGRADE_ENABLED: "abc, def, xyz",
        CODETAGS_UPGRADE_DISABLED: "disabled",
      })
      codetags.reset();
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
    after(function() {
      envmask.reset();
      codetags.reset();
    })
  });
});
