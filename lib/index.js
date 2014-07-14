"use strict";
var config, esprima, logger, registration, __checkUsedDependencies, __handleCommonJSWrapper, __handleVanillaAMDDefine, __isDefineCall, __isObjectNotNull, __isntExcluded, __traverse, _run;

esprima = require('esprima');

config = require("./config");

logger = null;

registration = function(mimosaConfig, register) {
  logger = mimosaConfig.log;
  return register(['add', 'update', 'buildFile'], 'betweenCompileWrite', _run, mimosaConfig.extensions.javascript);
};

_run = function(mimosaConfig, options, next) {
  var ast, err, file, _i, _len, _ref;
  _ref = options.files;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    file = _ref[_i];
    if (__isntExcluded(file.inputFileText, mimosaConfig.requireLint)) {
      try {
        ast = esprima.parse(file.outputFileText);
      } catch (_error) {
        err = _error;
        logger.error("require-lint failed to parse JavaScript file [[ " + file.inputFileName + " ]]", err);
      }
      if (ast) {
        __checkUsedDependencies(file.inputFileName, ast);
      }
    }
  }
  return next();
};

__isntExcluded = function(fileName, rl) {
  if (rl.exclude && rl.exclude.indexOf(fileName) !== -1) {
    return false;
  }
  if (rl.excludeRegex && fileName.match(rl.excludeRegex)) {
    return false;
  }
  return true;
};

__isDefineCall = function(n) {
  return n && n.type === 'CallExpression' && n.callee.type === 'Identifier' && n.callee.name === 'define';
};

__checkUsedDependencies = function(inputFileName, syntax) {
  return __traverse(syntax, __isDefineCall, function(node) {
    var arg, defineCallbackNode, defineListNode, p, _i, _len, _ref;
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
      if ((defineCallbackNode != null ? defineCallbackNode.params.length : void 0) > 0) {
        p = defineCallbackNode.params;
        if ((defineListNode != null ? defineListNode.elements.length : void 0) > 0) {
          return __handleVanillaAMDDefine(defineCallbackNode, defineListNode, inputFileName);
        } else if (p.length === 3 && p[0].name === "require" && p[1].name === "exports" && p[2].name === "module") {
          return __handleCommonJSWrapper(defineCallbackNode, inputFileName);
        } else {
          return logger.debug("[[ " + inputFileName + " ]] does not seem to be AMD compliant");
        }
      }
    }
  });
};

__handleCommonJSWrapper = function(defineCallbackNode, inputFileName) {
  var allUsedVars, defineList, i, rVar, requireVars, _i, _len, _results;
  requireVars = [];
  allUsedVars = {};
  defineList = [];
  __traverse(defineCallbackNode.body, null, function(node) {
    var _ref, _ref1, _ref2, _ref3;
    if (node.type === "VariableDeclarator" && ((_ref = node.init) != null ? _ref.type : void 0) === "CallExpression" && ((_ref1 = node.init.callee) != null ? _ref1.type : void 0) === "Identifier" && node.init.callee.name === "require") {
      if (((_ref2 = node.init["arguments"][0]) != null ? _ref2.value : void 0) && node.id.name) {
        defineList.push((_ref3 = node.init["arguments"][0]) != null ? _ref3.value : void 0);
        return requireVars.push(node.id.name);
      }
    } else if (node.type === "Identifier") {
      if (allUsedVars[node.name] != null) {
        return allUsedVars[node.name] = true;
      } else {
        return allUsedVars[node.name] = false;
      }
    }
  });
  _results = [];
  for (i = _i = 0, _len = requireVars.length; _i < _len; i = ++_i) {
    rVar = requireVars[i];
    if (!allUsedVars[rVar]) {
      _results.push(logger.warn("Dependency [[ " + defineList[i] + " ]] declared but not used in [[ " + inputFileName + " ]]"));
    }
  }
  return _results;
};

__handleVanillaAMDDefine = function(defineCallbackNode, defineListNode, inputFileName) {
  var defineList, i, param, params, _i, _len, _results;
  params = defineCallbackNode.params.map(function(param) {
    return {
      name: param.name,
      found: false
    };
  });
  __traverse(defineCallbackNode.body, null, function(node) {
    var param, _i, _len, _results;
    if (node.type === "Identifier") {
      _results = [];
      for (_i = 0, _len = params.length; _i < _len; _i++) {
        param = params[_i];
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
  for (i = _i = 0, _len = params.length; _i < _len; i = ++_i) {
    param = params[i];
    if (param.found === false) {
      _results.push(logger.warn("Dependency [[ " + defineList[i] + " ]] declared but not used in [[ " + inputFileName + " ]]"));
    }
  }
  return _results;
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
    }
  }
  return _results;
};

__isObjectNotNull = function(o) {
  return typeof o === 'object' && o !== null;
};

module.exports = {
  registration: registration,
  defaults: config.defaults,
  placeholder: config.placeholder,
  validate: config.validate
};
