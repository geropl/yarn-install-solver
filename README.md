# yarn install solver

This repo is a playground for looking for a solution to the problem that `yarn install` is not able to install exactlly one instance of a module. Instead, it takes the 'best' (aka 'latest') version for each package. This is a problem for programs e.g. that rely libraries like [inversify](https://github.com/inversify/InversifyJS), which assumes that there is every only exactlly one instance of each module loaded.
Several approaches exist (like `yarn install --auto`) but are not satisfying.

As the [yarn codebase](https://github.com/yarnpkg/yarn) is quite unaccessible - at least for me - I'll follow a clean sheet approach to prove the idea.

## How it works

Inspired by: https://github.com/dxu/yarn/pull/1

  0. Starting from a given module and it's `dependencies` and `devDependencies`,
  1. each module version expression is flattened to a list of fix version numbers using [npm](https://github.com/npm/npm-registry-client).
  2. For each of these versions, all possible `dependencies` and are fetched as well and processed in the same manner
  3. At the end, we have the whole graph of transitive dependencies of allowed version combinations of all packages.
  4. This is translated to a logic formula and stuffed into [logic-solver](https://github.com/meteor/logic-solver), a JS wrapper around the famous [minisat](http://minisat.se) library.
