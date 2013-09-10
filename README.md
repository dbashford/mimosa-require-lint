mimosa-require-lint
===========
## Overview

This module will scan your JavaScript files for unused AMD dependencies. Someday it may do more. If you've got any ideas, fire up an issue!

For more information regarding Mimosa, see http://mimosa.io.

## Usage

Add `'require-lint'` to your list of modules.  That's all!  Mimosa will install the module for you when you start up.

## Functionality

### Unused Dependencies

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

Note: This module currently only works with classic AMD syntax and will not work with CommonJS wrapped modules.

## Default Config

This module currently has no config.