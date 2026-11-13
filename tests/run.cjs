const { readdirSync } = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

// Expand files without shell globbing, which differs between Windows and Node 18 CI.
const files = readdirSync(__dirname).filter(file => file.endsWith('.test.cjs')).sort().map(file => path.join(__dirname, file))
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' })
if (result.error) throw result.error
process.exit(result.status ?? 1)
