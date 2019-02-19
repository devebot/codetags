'use strict';

const semver = require('semver');
const nodash = require('./nodash');

const DEFAULT_NAMESPACE = 'CODETAGS';

function Codetags(args) {
  const store = { env: {}, declaredTags: [], cachedTags: {} };
  const presets = {};

  this.initialize = function(cfg = {}) {
    ['namespace', 'INCLUDED_TAGS', 'EXCLUDED_TAGS'].forEach(function(attr) {
      if (nodash.isString(cfg[attr])) {
        presets[attr] = nodash.labelify(cfg[attr]);
      }
    });
    ['version'].forEach(function(attr) {
      if (nodash.isString(cfg[attr])) {
        presets[attr] = cfg[attr];
      }
    });
    refreshEnv(presets, store);
    return this;
  }

  this.isActive = function() {
    return isArgumentsSatisfied(store, arguments);
  }

  this.register = function(descriptors) {
    addDescriptors(presets, store, descriptors);
    return this;
  }

  this.clearCache = function() {
    for(const tagName in store.cachedTags) {
      delete store.cachedTags[tagName];
    }
    refreshEnv(presets, store);
    return this;
  }

  this.reset = function() {
    this.clearCache();
    store.declaredTags.length = 0;
    for(const attr in presets) {
      delete presets[attr];
    }
    return this;
  }

  this.getDeclaredTags = function () {
    return cloneTags(store, 'declaredTags');
  }

  this.getIncludedTags = function () {
    return cloneTags(store, 'includedTags');
  }

  this.getExcludedTags = function () {
    return cloneTags(store, 'excludedTags');
  }

  this.initialize(args);
}

function cloneTags(store, collectionType) {
  if (nodash.isArray(store[collectionType])) {
    return store[collectionType].slice(0);
  }
  return null;
}

function addDescriptors(presets, store, descriptors) {
  if (nodash.isArray(descriptors)) {
    const tags = descriptors
      .filter(function(def) {
        if (def === undefined || def === null) return false;
        const plan = def.plan;
        if (plan && nodash.isBoolean(plan.enabled) && isVersionValid(presets.version)) {
          let validated = true;
          let satisfied = true;
          const minBound = plan.minBound || plan.from || plan.begin;
          if (nodash.isString(minBound)) {
            validated = validated && isVersionValid(minBound);
            if (validated) {
              satisfied = satisfied && isVersionLTE(minBound, presets.version);
            }
          }
          const maxBound = plan.maxBound || plan.to || plan.end;
          if (nodash.isString(maxBound)) {
            validated = validated && isVersionValid(maxBound);
            if (validated) {
              satisfied = satisfied && isVersionLT(presets.version, maxBound);
            }
          }
          if (validated) {
            if (satisfied) {
              return plan.enabled;
            } else {
              if (nodash.isBoolean(def.enabled)) return def.enabled;
              return !plan.enabled;
            }
          }
        }
        if (def.enabled === false) return false;
        return true;
      })
      .map(function(def) {
        if (nodash.isString(def)) return def;
        return def.tag || def.name || def.label;
      });
    tags.forEach(function(tag) {
      if (store.declaredTags.indexOf(tag) < 0) {
        store.declaredTags.push(tag);
      }
    });
  }
  return store.declaredTags;
}

function isVersionValid(version) {
  return semver.valid(version);
}

function isVersionLTE(version1, version2) {
  return semver.lte(version1, version2);
}

function isVersionLT(version1, version2) {
  return semver.lt(version1, version2);
}

function refreshEnv(presets, store) {
  for(const envName in store.env) {
    delete store.env[envName];
  }
  for(const field of ['includedTags', 'excludedTags']) {
    store[field] = getEnv(store, getLabel(presets, field));
  }
}

function getEnv(store, label, defaultValue) {
  if (label in store.env) return store.env[label];
  if (!nodash.isString(label)) return undefined;
  store.env[label] = getValue(label) || defaultValue;
  store.env[label] = nodash.stringToArray(store.env[label]);
  return store.env[label];
}

function getLabel(presets, label) {
  const prefix = (presets['namespace'] || DEFAULT_NAMESPACE);
  if (label === 'namespace') {
    return prefix;
  } else {
    switch(label) {
      case 'includedTags': {
        return prefix + '_' + (presets['INCLUDED_TAGS'] || 'INCLUDED_TAGS');
      }
      case 'excludedTags': {
        return prefix + '_' + (presets['EXCLUDED_TAGS'] || 'EXCLUDED_TAGS');
      }
    }
    return prefix + '_' + (presets[label] || nodash.labelify(label));
  }
}

function getValue(name) {
  return process.env[name];
}

function isArgumentsSatisfied(store, tuples) {
  for(const i in tuples) {
    if (evaluateExpression(store, tuples[i])) return true;
  }
  return false;
}

function evaluateExpression(store, exp) {
  if (nodash.isArray(exp)) {
    return isAllOfLabelsSatisfied(store, exp);
  }
  if (nodash.isObject(exp)) {
    for(const op in exp) {
      switch(op) {
        case '$all':
        case '$and': {
          if (isAllOfLabelsSatisfied(store, exp[op]) === false) return false;
          break;
        }
        case '$any':
        case '$or': {
          if (isAnyOfLabelsSatisfied(store, exp[op]) === false) return false;
          break;
        }
        case '$not': {
          if (isNotOfLabelsSatisfied(store, exp[op]) === false) return false;
          break;
        }
        default: {
          return false;
        }
      }
    }
    return true;
  }
  return checkLabelActivated(store, exp);
}

function isNotOfLabelsSatisfied(store, labels) {
  return !evaluateExpression(store, labels);
}

function isAnyOfLabelsSatisfied(store, labels) {
  if (nodash.isArray(labels)) {
    for(const k in labels) {
      if (evaluateExpression(store, labels[k])) return true;
    }
    return false;
  }
  return evaluateExpression(store, labels);
}

function isAllOfLabelsSatisfied(store, labels) {
  if (nodash.isArray(labels)) {
    for(const k in labels) {
      if (!evaluateExpression(store, labels[k])) return false;
    }
    return true;
  }
  return evaluateExpression(store, labels);
}

function checkLabelActivated(store, label) {
  if (label in store.cachedTags) {
    return store.cachedTags[label];
  }
  return (store.cachedTags[label] = forceCheckLabelActivated(store, label));
}

function forceCheckLabelActivated(store, label) {
  if (store.excludedTags.indexOf(label) >= 0) return false;
  if (store.declaredTags.indexOf(label) >= 0) return true;
  return (store.includedTags.indexOf(label) >= 0);
}

const INSTANCES = {};

const singleton = INSTANCES[DEFAULT_NAMESPACE] = new Codetags();

singleton.newInstance = function(name, opts = {}) {
  name = nodash.labelify(name);
  if (!nodash.isString(name)) {
    throw new Error('name of a codetags instance must be a string');
  }
  if (name === DEFAULT_NAMESPACE) {
    throw new Error([
      DEFAULT_NAMESPACE + ' is default instance name.',
      'Please provides another name.'
    ].join(' '));
  }
  opts.namespace = opts.namespace || name;
  return INSTANCES[name] = new Codetags(opts);
}

singleton.getInstance = function(name, opts) {
  name = nodash.labelify(name);
  if (nodash.isObject(INSTANCES[name])) {
    if (nodash.isObject(opts)) {
      INSTANCES[name].initialize(opts);
    }
    return INSTANCES[name];
  } else {
    return this.newInstance(name, opts);
  }
}

module.exports = singleton;
