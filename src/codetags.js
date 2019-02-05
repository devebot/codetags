'use strict';

const semver = require('semver');
const nodash = require('./nodash');

function Codetags(args) {
  const store = { env: {}, activeTags: [], cachedTags: {} };
  const presets = {};

  this.initialize = function(cfg = {}) {
    ['namespace', 'POSITIVE_TAGS', 'NEGATIVE_TAGS', 'version'].forEach(function(attr) {
      if (nodash.isString(cfg[attr])) {
        presets[attr] = nodash.labelify(cfg[attr]);
      }
    });
    return this;
  }

  this.isActive = function() {
    if (!store.positiveTags) {
      store.positiveTags = getEnv(store, presets.namespace, getLabel(presets, 'POSITIVE_TAGS'));
    }
    if (!store.negativeTags) {
      store.negativeTags = getEnv(store, presets.namespace, getLabel(presets, 'NEGATIVE_TAGS'));
    }
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
    for(const attr in presets) {
      delete presets[attr];
    }
    return this;
  }

  this.initialize(args);
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
          const minBound = plan.from;
          if (nodash.isString(minBound)) {
            validated = validated && isVersionValid(minBound);
            if (validated) {
              satisfied = satisfied && isVersionLTE(minBound, presets.version);
            }
          }
          const maxBound = plan.to;
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
      if (store.activeTags.indexOf(tag) < 0) {
        store.activeTags.push(tag);
      }
    });
  }
  return store.activeTags;
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

function getEnv(store, namespace, label, defaultValue) {
  if (label in store.env) return store.env[label];
  if (!nodash.isString(label)) return undefined;
  store.env[label] = getValue(namespace, label) || defaultValue;;
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
  if (store.negativeTags.indexOf(label) >= 0) return false;
  if (store.activeTags.indexOf(label) >= 0) return true;
  return (store.positiveTags.indexOf(label) >= 0);
}

const singleton = new Codetags();

const BRANCH_REF = {};

singleton.createBranch = function(name, opts = {}) {
  if (!nodash.isString(name)) {
    throw new Error('name of codetags branch must be a string');
  }
  opts.namespace = opts.namespace || name;
  return BRANCH_REF[name] = new Codetags(opts);
}

singleton.assertBranch = function(name, opts) {
  return BRANCH_REF[name] = BRANCH_REF[name] || this.createBranch(name, opts);
}

module.exports = singleton;
