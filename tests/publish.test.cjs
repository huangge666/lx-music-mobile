const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const { parseChangelog } = require('../publish/utils/parseChangelog')
const { loadSource } = require('./load-source.cjs')

test('changelog parser preserves version, date and complete description', async() => {
  const versions = await parseChangelog('## [2.1.9](https://example.test) - 2026-10-24\n\n### Fixed\n- A\n\n## 2.1.8 - 2026-10-05\n- B')
  assert.deepEqual(versions, [
    { version: '2.1.9', date: '2026-10-24', desc: '### Fixed\n- A' },
    { version: '2.1.8', date: '2026-10-05', desc: '- B' },
  ])
})

test('repository changelog has valid dates for every parsed release', async() => {
  const versions = await parseChangelog(fs.readFileSync(path.resolve(__dirname, '../CHANGELOG.md'), 'utf8'))
  assert(versions.length > 0)
  for (const version of versions) assert.match(version.date, /^\d{4}-\d{2}-\d{2}$/)
})

test('publish inserts the new release before the first existing version', async() => {
  const files = new Map([
    ['../../CHANGELOG.md', '# Changelog\n\n## [2.1.9](https://example.test) - 2026-10-24\n- Old\n'],
    ['../changeLog.md', '### Fixed\n- New\n'],
  ])
  const pkg = { version: '2.1.9', versionCode: 114, repository: { url: 'git+https://github.com/owner/repo.git' } }
  const version = { version: '2.1.9', desc: 'Old', history: [] }
  const update = loadSource('publish/utils/updateChangeLog.js', {
    fs: { readFileSync: file => files.get(file), writeFileSync: (file, value) => files.set(file, value) },
    './index': { jp: value => value, formatTime: () => '2026-11-13' },
    '../../package.json': pkg,
    '../version.json': version,
    chalk: { blue: value => value, green: value => value },
    './parseChangelog': { parseChangelog },
  })
  await update('2.1.10')
  const versions = await parseChangelog(files.get('../../CHANGELOG.md'))
  assert.equal(versions[0].version, '2.1.10')
  assert.equal(versions[1].version, '2.1.9')
  assert.equal(pkg.versionCode, 115)
})

test('invalid changelog aborts publish before changing version files', async() => {
  const writes = []
  const pkg = { version: '2.1.9', versionCode: 114 }
  const update = loadSource('publish/utils/updateChangeLog.js', {
    fs: { readFileSync: () => 'No versions here', writeFileSync: file => writes.push(file) },
    './index': { jp: value => value },
    '../../package.json': pkg,
    '../version.json': { version: '2.1.9', history: [] },
    './parseChangelog': { parseChangelog },
  })
  await assert.rejects(update('2.1.10'), /CHANGELOG/)
  assert.equal(writes.length, 0)
  assert.equal(pkg.versionCode, 114)
})

test('release verifies the existing production certificate for every APK before tagging or uploading', () => {
  const { parse } = require('yaml')
  const workflow = parse(fs.readFileSync(path.resolve(__dirname, '../.github/workflows/release.yml'), 'utf8'))
  const steps = workflow.jobs.Android.steps
  const signingIndex = steps.findIndex(step => step.name == 'Verify release signing')
  assert(signingIndex > steps.findIndex(step => step.name == 'Build Packages'))
  assert(signingIndex < steps.findIndex(step => step.name == 'Create git tag'))
  assert(signingIndex < steps.findIndex(step => step.name == 'Upload Artifact'))
  const signing = steps[signingIndex]
  assert.equal(signing.env.EXPECTED_CERT_SHA256, 'a2753d801a597b670393d7f008e4b78dd830c3fff75d68946525398b796e94c2')
  assert.match(signing.run, /for ABI in arm64-v8a armeabi-v7a x86 x86_64 universal/)
  assert.match(signing.run, /verify --print-certs/)
  assert.match(signing.run, /if \[ "\$CERT" != "\$EXPECTED_CERT_SHA256" \]; then[\s\S]+exit 1/)
  const build = steps.find(step => step.name == 'Build Packages')
  assert.match(build.run, /set -euo pipefail/)
  assert.match(build.run, /if \[ -z "\$\{!name\}" \]; then[\s\S]+exit 1/)
})
