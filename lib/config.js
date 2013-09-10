"use strict";
exports.defaults = function() {
  return {
    minify: {
      exclude: ["\\.min\\."]
    }
  };
};

exports.placeholder = function() {
  return "\t\n\n  # minify:                  #\n    # exclude:[/\\.min\\./]    #";
};

exports.validate = function(config, validators) {
  var errors;
  errors = [];
  return errors;
};
