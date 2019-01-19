'use strict';

const nodash = require('./nodash');

function Codetags() {
  const store = { env: {}, activeTags: [] };
  const setting = {};

  this.initialize = function(cfg = {}) {
    ['namespace', 'POSITIVE_TAGS', 'NEGATIVE_TAGS'].forEach(function(attr) {
      if (nodash.isString(cfg[attr])) {
        setting[attr] = cfg[attr].toUpperCase();
      }
    });
    return this;
  }

  this.isActive = function() {
    if (!store.positiveTags) {
      store.positiveTags = getEnv(store, setting.namespace, getLabel(setting, 'POSITIVE_TAGS'));
    }
    if (!store.negativeTags) {
      store.negativeTags = getEnv(store, setting.namespace, getLabel(setting, 'NEGATIVE_TAGS'));
    }
    return isAnyOfTuplesSatistied(store, arguments);
  }

  this.register = function(descriptors) {
    addDescriptors(store.activeTags, descriptors);
    return this;
  }

  this.clearCache = function() {
    store.negativeTags = null;
    store.positiveTags = null;
    for(const envName in store.env) {
      delete store.env[envName];
    }
    return this;
  }

  this.reset = function() {
    this.clearCache();
    store.activeTags.length = 0;
    for(const attr in setting) {
      delete setting[attr];
    }
    return this;
  }
}

function addDescriptors(activeTags, descriptors) {
  if (nodash.isArray(descriptors)) {
    const tags = descriptors.filter(function(def) {
      return def.enabled !== false;
    }).map(function(def) {
      return def.tag || def.name || def.label;
    });
    tags.forEach(function(tag) {
      if (activeTags.indexOf(tag) < 0) {
        activeTags.push(tag);
      }
    });
  }
  return activeTags;
}

function getEnv(store, namespace, label, defaultValue) {
  if (label in store.env) return store.env[label];
  if (!nodash.isString(label)) return undefined;
  store.env[label] = getValue(namespace, label);
  if (!store.env[label]) {
    store.env[label] = store.env[label] || defaultValue;
  }
  store.env[label] = nodash.stringToArray(store.env[label]);
  return store.env[label];
}

function getLabel(labels, label) {
  return labels[label] || label;
}

function getValue(namespace, name) {
  if (namespace) {
    const longname = namespace + '_' + name;
    if (longname in process.env) {
      return process.env[longname];
    }
  }
  return process.env['CODETAGS' + '_' + name];
}

function isAnyOfTuplesSatistied(store, tuples) {
  for(const i in tuples) {
    if (isAllOfLabelsSatisfied(store, tuples[i])) return true;
  }
  return false;
}

function isAllOfLabelsSatisfied(store, labels) {
  if (!labels) return false;
  if (nodash.isArray(labels)) {
    for(const k in labels) {
      if (!checkLabelActivated(store, labels[k])) return false;
    }
    return true;
  }
  return checkLabelActivated(store, labels);
}

function checkLabelActivated(store, label) {
  if (store.negativeTags.indexOf(label) >= 0) return false;
  if (store.activeTags.indexOf(label) >= 0) return true;
  return (store.positiveTags.indexOf(label) >= 0);
}

module.exports = new Codetags();
