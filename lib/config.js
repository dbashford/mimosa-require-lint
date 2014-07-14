"use strict";

exports.defaults = function() {
  return {
    requireLint: {
      exclude: []
    }
  };
};

exports.placeholder = function() {
  var ph = "\n  requireLint:                  # settings for require linting\n" +
     "    exclude:[]               # array of strings or regexes that match files to not require-lint,\n" +
     "                             # strings are paths that can be relative to the watch.sourceDir\n" +
     "                             # or absolute\n";
  return ph;
};

exports.validate = function (config, validators) {
  var errors = [];

  if (validators.ifExistsIsObject(errors, "requireLint config", config.requireLint)) {
    validators.ifExistsFileExcludeWithRegexAndString(
      errors, "requireLint.exclude", config.requireLint, config.watch.sourceDir);
  }

  return errors;
};
