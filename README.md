mimosa-require-lint
===========
## Overview

This module will scan your JavaScript files for unused AMD dependencies. Someday it may do more. If you've got any ideas, fire up an issue!

For more information regarding Mimosa, see http://mimosa.io.

## Usage

Add `'require-lint'` to your list of modules.  That's all!  Mimosa will install the module for you when you start up.

## Functionality

### Unused Dependencies

#### Vanilla AMD

```javascript
define(['backbone','underscore'], function(Backbone, _) {
  var view = new Backbone.View()
  return view;
})
```

For the above totally worthless piece of code, this module will provide the following warning:
```
Dependency [[ underscore ]] declared but not used in [[ /path/to/lame/file.js ]]
```

#### CommonJS Wrapper

It will also work for the AMD CommonJS wrapper

```javascript
define(function(require, exports, module){
    var Backbone = require('backbone'),
    var _ = require('underscore');

    var view = new Backbone.View()
    module.exports = view;
});
```

And the warning:
```
Dependency [[ underscore ]] declared but not used in [[ /path/to/lame/file.js ]]
```

## Default Config

This module currently has no config.