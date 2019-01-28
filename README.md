# codetags

> A simple feature toggle utility

## What is this?

`codetags` is a simple feature toggle utility for javascript/nodejs. Developers could use this library to prepare new features and switch the features by using environment variables.

## Examples

### Default codetags instance

Register feature tags:

```javascript
// file: bootstrap.js
const codetags = require('codetags');

codetags.register([
  {
    name: 'replace-console-log-with-winston',
    enabled: false
  },
  {
    name: 'moving-from-mongodb-to-couchbase',
    enabled: true
  },
]);
```

Check the state of tags:

```javascript
// file: index.js
require('./bootstrap.js');
const codetags = require('codetags');

// ...

if (codetags.isActive('replace-console-log-with-winston')) {
  // be disabled by default
  winston.log('debug', 'Hello world from winston');
} else {
  console.log('Hello world from console.log');
}
```

Change state of tags with environment variables:

```shell
export CODETAGS_POSITIVE_TAGS=replace-console-log-with-winston
export CODETAGS_NEGATIVE_TAGS=moving-from-mongodb-to-couchbase
node index.js
```

### Multiple instances

Create multiple `codetags` instances:

```javascript
// file: bootstrap.js
const codetags = require('codetags');

// features for trunk branch
const trunk = codetags.createBranch('trunk', {
  namespace: 'my_mission'
});

trunk.register([
  {
    name: 'replace-console-log-with-winston',
    enabled: false
  },
  {
    name: 'moving-from-mongodb-to-couchbase',
    enabled: true
  },
]);

// features for trial branch
const trial = codetags.createBranch('trial', {
  namespace: 'my_passion'
});

trial.register(['foo', 'bar']);
```

Make conditional flow:

```javascript
// file: index.js
require('./bootstrap.js');
const codetags = require('codetags');
const trunk = codetags.assertBranch('trunk');
const tryit = codetags.assertBranch('trial');

// ...

if (trunk.isActive('replace-console-log-with-winston')) {
  // be disabled by default
  winston.log('debug', 'Hello world from winston');
} else {
  console.log('Hello world from console.log');
}

// ...

if (tryit.isActive('foo')) {
  // do something here
}

if (tryit.isActive(['foo', 'bar'])) {
  // and here
}

if (tryit.isActive('foo', 'bar')) {
  // and here
}
```

Change state of tags with environment variables:

```shell
export MY_MISSION_POSITIVE_TAGS=replace-console-log-with-winston
export MY_PASSION_NEGATIVE_TAGS=foo,bar
node index.js
```
