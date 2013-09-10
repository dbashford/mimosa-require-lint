"use strict"

esprima = require 'esprima'
logger = require 'logmimosa'

registration = (mimosaConfig, register) ->
  register ['add','update','buildFile'], 'betweenCompileWrite', _run, mimosaConfig.extensions.javascript

_run = (mimosaConfig, options, next) ->
  for file in options.files
    try
      ast = esprima.parse file.outputFileText
    catch err
      logger.error "require-lint failed to parse JavaScript file [[ #{file.inputFileName} ]]", err

    if ast
      __checkUsedDependencies file.inputFileName, ast

  next()

__isDefineCall = (n) ->
  n.type is 'CallExpression' and n.callee.type is 'Identifier' and n.callee.name is 'define'

__checkUsedDependencies = (inputFileName, syntax) ->
  __traverse syntax, __isDefineCall, (node) ->
    if __isDefineCall node
      return unless node.arguments

      for arg in node.arguments
        if arg.type is "FunctionExpression"
          defineCallbackNode = arg
        if arg.type is "ArrayExpression"
          defineListNode = arg

      # no going further if no parameters passed into callback
      if defineCallbackNode?.params.length > 0
        p = defineCallbackNode.params

        # if define has list, then is vanilla AMD define: define(['foo'], function(foo){})
        if defineListNode?.elements.length > 0
          __handleVanillaAMDDefine defineCallbackNode, defineListNode, inputFileName

        # if define callback params match commonjs wrapper
        else if p.length is 3 and p[0].name is "require" and p[1].name is "exports" and p[2].name is "module"
          __handleCommonJSWrapper defineCallbackNode, inputFileName
        else
          logger.debug "[[ #{inputFileName} ]] does not seem to be AMD compliant"

__handleCommonJSWrapper = (defineCallbackNode, inputFileName) ->
  requireVars = []
  allUsedVars = {}
  defineList = []
  __traverse defineCallbackNode.body, null, (node) ->
    if node.type is "VariableDeclarator" and
    node.init?.type is "CallExpression" and
    node.init.callee?.type is "Identifier" and
    node.init.callee.name is "require"

      if node.init.arguments[0]?.value and node.id.name
        defineList.push node.init.arguments[0]?.value
        requireVars.push node.id.name

    else if node.type is "Identifier"
      if allUsedVars[node.name]?
        allUsedVars[node.name] = true
      else
        allUsedVars[node.name] = false

  # If only once, then is from initial require and not used again
  for rVar, i in requireVars when not allUsedVars[rVar]
    logger.warn "Dependency [[ #{defineList[i]} ]] declared but not used in [[ #{inputFileName} ]]"

__handleVanillaAMDDefine = (defineCallbackNode, defineListNode, inputFileName) ->
  params = defineCallbackNode.params.map (param) -> name:param.name, found:false
  __traverse defineCallbackNode.body, null, (node) ->
    if node.type is "Identifier"
      for param in params when param.name is node.name
        param.found = true

  defineList = defineListNode.elements.map (ele) -> ele.value
  for param, i in params when param.found is false
    logger.warn "Dependency [[ #{defineList[i]} ]] declared but not used in [[ #{inputFileName} ]]"

__traverse = (node, breakAt, func) ->
  func node
  return if breakAt?(node)
  for key, child of node when __isObjectNotNull child
    if Array.isArray(child)
      child.forEach (node) -> __traverse node, breakAt, func
    else
      __traverse child, breakAt, func

__isObjectNotNull = (o) ->
  typeof o is 'object' and o isnt null

module.exports =
  registration: registration
