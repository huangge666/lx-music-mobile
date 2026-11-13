const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')

test('all locales have the same keys and app-authored copy contains no emoji', () => {
  const locales = ['zh-cn', 'zh-tw', 'en-us'].map(locale => JSON.parse(fs.readFileSync(path.resolve(__dirname, `../src/lang/${locale}.json`), 'utf8')))
  const keys = Object.keys(locales[0]).sort()
  for (const locale of locales) {
    assert.deepEqual(Object.keys(locale).sort(), keys)
    for (const [key, value] of Object.entries(locale)) assert(!/\p{Extended_Pictographic}/u.test(value), `emoji in ${key}`)
  }
})
