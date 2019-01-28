'use strict';

function Nodash() {

  this.arrayify = function (val) {
    if (val === null || val === undefined) return [];
    return Array.isArray(val) ? val : [val];
  }

  this.isArray = function(a) {
    return a instanceof Array;
  }

  this.isFunction = function(f) {
    return typeof(f) === 'function';
  }

  this.isObject = function(o) {
    return o && typeof(o) === 'object' && !this.isArray(o);
  }

  this.isString = function(s) {
    return typeof(s) === 'string';
  }

  this.isUndefined = function(u) {
    return typeof u === 'undefined';
  }

  this.stringToArray = function (labels) {
    labels = labels || '';
    if (this.isString(labels)) {
      return labels.split(',').map(function(item) {
        return item.trim();
      }).filter(function(item) {
        return item.length > 0;
      });
    }
    return labels;
  }

  this.labelify = function(str) {
    if (!this.isString(str)) return str;
    return str.toUpperCase().replace(/\W{1,}/g, '_');
  };

  this.union = function() {
    
  }
}

module.exports = new Nodash();
