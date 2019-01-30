# codetags

> A simple feature toggle utility

## What is `codetags`?

`codetags` is a simple feature toggle utility for javascript/nodejs. Developers could use this library to prepare new features and switch the features by using environment variables.

## How does it work?

![Architecture](https://raw.github.com/devebot/codetags/master/docs/assets/images/codetags-architecture.png)

### Get a `codetags` instance

A default `codetags` instance can be retrieved simply by a `require` call:

```shell
const codetags = require('codetags');
```

We can create multiple `codetags's space` with `createBranch` or `assertBranch` methods. Call to both will create a codetags instance, but the `assertBranch` create a new instance only if it's existed before.

```javascript
const codetags = require('codetags');

const space1 = codetags.assertBranch('main', {
  namespace: 'maincode'
});
const space2 = codetags.createBranch('test', {
  namespace: 'testcode'
});

// ...

const space3 = codetags.assertBranch('main', {
  namespace: 'maincode'
});
console.log(space3 === space1); // true
const space4 = codetags.createBranch('test', {
  namespace: 'testcode'
});
console.log(space4 === space2); // false
```

### Initializing default tags

Default tags can be initialized by `register()` method:

```javascript
codetags_instance.register(an_array_of_tag_descriptors);
```

For example:

```javascript
codetags.register(['a-simple-tag']);
```

similar to:

```javascript
codetags.register([
  {
    name: 'a-simple-tag',
    enabled: true
  }
]);
```

More complex example:

```javascript
codetags.register([
  'foo',
  {
    name: 'bar'
  },
  {
    name: 'nil',
    enabled: false
  }
]);
```

### Wrapping code in conditional block

```javascript
const codetags = require('codetags');

// ...

if (codetags.isActive('foo')) {
  // do something
}

if (tryit.isActive(['foo', 'bar'])) {
  // do other things
}
```

### Enable/disable tags

Declare environment variables:

```shell
export CODETAGS_POSITIVE_TAGS=nil,foo
export CODETAGS_NEGATIVE_TAGS=bar
```

Start node program:

```shell
node index.js
```

## Conditional expressions

Method `isActive` will evaluate an expression of tags based on collections of tags to determine whether it is accepted or denied. An expression of tags is composed by tags (in string format), array and hashmap structures and conditional operators (`$and`, `$or`, `$not`).

### `tagexp` is a single string

Syntax:

```javascript
codetags.isActive('tagexp-is-a-string');
```

### `tagexp` is an array of tagexps

Syntax:

```javascript
codetags.isActive([tagexp1, tagexp2, tagexp3]);
```

### `tagexp` is a conditional expression

Syntax:

```javascript
codetags.isActive({
  $and: [
    {
      $not: tagexp0,
      $or: [ tagexp1, tagexp2, tagexp3 ]
    },
    {
      $or: [ tagexp4, tagexp5 ]
    }
  ]
});
```

### `arguments` is a sequence of `tagexp`s

Syntax:

```javascript
codetags.isActive(tagexp1, tagexp2, tagexp3);
```

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
