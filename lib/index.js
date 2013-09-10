"use strict";
var esprima, logger, registration, __checkUsedDependencies, __isDefineCall, __isObjectNotNull, __traverse, _run;

esprima = require('esprima');

logger = require('logmimosa');

registration = function(mimosaConfig, register) {
  return register(['add', 'update', 'buildFile'], 'betweenCompileWrite', _run, mimosaConfig.extensions.javascript);
};

_run = function(mimosaConfig, options, next) {
  var ast, file, _i, _len, _ref;
  _ref = options.files;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    file = _ref[_i];
    ast = esprima.parse(file.outputFileText);
    __checkUsedDependencies(file.inputFileName, ast);
  }
  return next();
};

__isDefineCall = function(n) {
  return n.type === 'CallExpression' && n.callee.type === 'Identifier' && n.callee.name === 'define';
};

__checkUsedDependencies = function(inputFileName, syntax) {
  return __traverse(syntax, __isDefineCall, function(node) {
    var arg, defineCallbackNode, defineList, defineListNode, i, param, params, _i, _j, _len, _len1, _ref, _results;
    if (__isDefineCall(node)) {
      if (!node["arguments"]) {
        return;
      }
      _ref = node["arguments"];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        arg = _ref[_i];
        if (arg.type === "FunctionExpression") {
          defineCallbackNode = arg;
        }
        if (arg.type === "ArrayExpression") {
          defineListNode = arg;
        }
      }
      if (!(defineCallbackNode && defineCallbackNode.params.length > 0 && defineListNode && defineListNode.elements.length > 0)) {
        return;
      }
      params = defineCallbackNode.params.map(function(param) {
        return {
          name: param.name,
          found: false
        };
      });
      __traverse(defineCallbackNode.body, null, function(node) {
        var param, _j, _len1, _results;
        if (node.type === "Identifier") {
          _results = [];
          for (_j = 0, _len1 = params.length; _j < _len1; _j++) {
            param = params[_j];
            if (param.name === node.name) {
              _results.push(param.found = true);
            }
          }
          return _results;
        }
      });
      defineList = defineListNode.elements.map(function(ele) {
        return ele.value;
      });
      _results = [];
      for (i = _j = 0, _len1 = params.length; _j < _len1; i = ++_j) {
        param = params[i];
        if (!param.found) {
          _results.push(logger.warn("Dependency [[ " + defineList[i] + " ]] declared but not used in [[ " + inputFileName + " ]]"));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }
  });
};

__traverse = function(node, breakAt, func) {
  var child, key, _results;
  func(node);
  if (typeof breakAt === "function" ? breakAt(node) : void 0) {
    return;
  }
  _results = [];
  for (key in node) {
    child = node[key];
    if (__isObjectNotNull(child)) {
      if (Array.isArray(child)) {
        _results.push(child.forEach(function(node) {
          return __traverse(node, breakAt, func);
        }));
      } else {
        _results.push(__traverse(child, breakAt, func));
      }
    } else {
      _results.push(void 0);
    }
  }
  return _results;
};

__isObjectNotNull = function(o) {
  return typeof o === 'object' && o !== null;
};

module.exports = {
  registration: registration
};
