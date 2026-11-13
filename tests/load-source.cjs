const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

// Execute the real app modules with small native-boundary doubles, without booting React Native.
exports.loadSource = (file, mocks = {}, globals = {}) => {
  const filename = path.resolve(__dirname, '..', file)
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText
  const module = { exports: {} }
  const context = vm.createContext({
    module,
    exports: module.exports,
    require(id) {
      if (Object.hasOwn(mocks, id)) return mocks[id]
      if (id.startsWith('.')) return require(path.resolve(path.dirname(filename), id))
      return require(id)
    },
    console: { log() {}, warn() {}, error() {} },
    setTimeout,
    clearTimeout,
    AbortController,
    URL,
    Buffer,
    ...globals,
  })
  context.global = context
  vm.runInContext(source, context, { filename })
  return module.exports
}

exports.deferred = () => {
  let resolve, reject
  const promise = new Promise((_resolve, _reject) => { resolve = _resolve; reject = _reject })
  return { promise, resolve, reject }
}

exports.flush = async() => new Promise(resolve => setImmediate(resolve))
