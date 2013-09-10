"use strict"

esprima = require 'esprima'
logger = require 'logmimosa'

registration = (mimosaConfig, register) ->
  register ['add','update','buildFile'], 'betweenCompileWrite', _run, mimosaConfig.extensions.javascript

_run = (mimosaConfig, options, next) ->
  for file in options.files
    ast = esprima.parse file.outputFileText
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

      # no going further if no list of defines or no callback funcation or no params passed to callback function
      return unless defineCallbackNode and defineCallbackNode.params.length > 0 and
        defineListNode and defineListNode.elements.length > 0

      params = defineCallbackNode.params.map (param) -> name:param.name, found:false
      __traverse defineCallbackNode.body, null, (node) ->
        if node.type is "Identifier"
          for param in params when param.name is node.name
            param.found = true

      defineList = defineListNode.elements.map (ele) -> ele.value
      for param, i in params when param.found is false
        logger.warn "Dependency [[ #{defineList[i]} ]] declared but not used in [[ #{inputFileName} ]]"

      #console.log "******"
      #console.log inputFileName
      #console.log JSON.stringify defineCallbackNode, null, 2
      #console.log JSON.stringify defineList, null, 2
      #console.log params
      #console.log "******"

__traverse = (node, breakAt, func) ->
  func node
  if breakAt?(node)
    return
  for key, child of node
    if __isObjectNotNull child
      if Array.isArray(child)
        child.forEach (node) -> __traverse node, breakAt, func
      else
        __traverse child, breakAt, func

__isObjectNotNull = (o) ->
  typeof o is 'object' and o isnt null

module.exports =
  registration: registration
