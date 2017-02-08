# Unity Cache

[![Travis-CI](https://api.travis-ci.org/auru/unity-cache.svg?branch=master)](https://travis-ci.org/auru/unity-cache)
[![Coverage Status](https://coveralls.io/repos/github/auru/unity-cache/badge.svg?branch=master)](https://coveralls.io/github/auru/unity-cache?branch=master)
[![npm version](https://badge.fury.io/js/unity-cache.svg)](https://badge.fury.io/js/unity-cache)
[![Scrutinizer](https://scrutinizer-ci.com/g/auru/unity-cache/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/auru/unity-cache/)
[![Deps](https://david-dm.org/auru/unity-cache/status.svg)](https://david-dm.org/auru/unity-cache)
[![Deps-Dev](https://david-dm.org/auru/unity-cache/dev-status.svg)](https://david-dm.org/auru/unity-cache)
[![Dependency Status](https://dependencyci.com/github/auru/unity-cache/badge)](https://dependencyci.com/github/auru/unity-cache)

> Cache abstraction around [Dexie.js](https://github.com/dfahlander/Dexie.js).

# Table of Contents
  * [Installation](#installation)
  * [API](#api)
  * [Contributing](#contributing)
  * [License](#license)

# Installation

```bash
npm i --save unity-cache
```

# API

## createCache(stores, name, version);

**Returns:** {Object}

Use module's `default export` to create an API object.

Return cache methods: `get`, `set`, `remove`, `drop`.

### stores {Array}

Database stores (tables).

### name {String} *Optional*
**Default:** `unity`

Database name.

### version {Number|String} *Optional*
**Default:** `1`

Database version. The old database with the same name will be deleted.

# Usage

You can call methods like so: ```cache[method](store, key, value)```

# Contributing

* Provide [conventional commit messages](https://github.com/conventional-changelog/conventional-changelog-angular/blob/master/convention.md) by using `npm run commit` instead of `git commit`.
* **Core contributors:** use GitHub's *Rebase and merge* as a default way of merging PRs.

# License
MIT © AuRu
