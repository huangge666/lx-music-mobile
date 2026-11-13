const fs = require('fs')
const { jp, formatTime } = require('./index')
const pkgDir = '../../package.json'
const pkg = require(pkgDir)
const version = require('../version.json')
const chalk = require('chalk')
const pkg_bak = JSON.stringify(pkg, null, 2)
const version_bak = JSON.stringify(version, null, 2)
const changelogPath = jp('../../CHANGELOG.md')
const { parseChangelog } = require('./parseChangelog')

const getPrevVer = (changeLog) => parseChangelog(changeLog).then(versions => {
  if (!versions.length) throw new Error('CHANGELOG 无法解析到版本号')
  return versions[0].version
})

const updateChangeLog = async(newVerNum, newChangeLog) => {
  let changeLog = fs.readFileSync(changelogPath, 'utf-8')
  const prevVer = await getPrevVer(changeLog)
  const log = `## [${newVerNum}](${pkg.repository.url.replace(/^git\+(http.+)\.git$/, '$1')}/compare/v${prevVer}...v${newVerNum}) - ${formatTime()}\n\n${newChangeLog}`
  return changeLog.replace(/^## /m, log.trimEnd() + '\n\n## ')
}


module.exports = async newVerNum => {
  if (!newVerNum) newVerNum = pkg.version
  const newMDChangeLog = fs.readFileSync(jp('../changeLog.md'), 'utf-8')
  // 解析失败先退出，不能已经改了版本文件才发现 CHANGELOG 无法更新。
  const newChangeLog = await updateChangeLog(newVerNum, newMDChangeLog)
  version.history.unshift({
    version: version.version,
    desc: version.desc,
  })
  version.version = newVerNum
  version.desc = newMDChangeLog.replace(/(?:^|(\n))#{1,6} (.+)\n/g, '$1$2').trim()
  pkg.version = newVerNum
  pkg.versionCode = pkg.versionCode + 1

  console.log(chalk.blue('new version: ') + chalk.green(newVerNum))

  fs.writeFileSync(jp('../version.json'), JSON.stringify(version) + '\n', 'utf-8')

  fs.writeFileSync(jp(pkgDir), JSON.stringify(pkg, null, 2) + '\n', 'utf-8')

  fs.writeFileSync(changelogPath, newChangeLog, 'utf-8')

  return {
    pkg_bak,
    version_bak,
  }
}

