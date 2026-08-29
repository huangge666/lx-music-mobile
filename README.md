<p align="center"><a href="https://github.com/huangge666/lx-music-mobile"><img width="180" src="https://github.com/lyswhut/lx-music-mobile/blob/master/doc/images/icon.png" alt="LX Music logo"></a></p>

<h1 align="center">LX Music 移动版</h1>

<p align="center">
  <a href="https://github.com/huangge666/lx-music-mobile/releases"><img src="https://img.shields.io/github/release/huangge666/lx-music-mobile" alt="Release version"></a>
  <a href="https://github.com/huangge666/lx-music-mobile/actions/workflows/release.yml"><img src="https://github.com/huangge666/lx-music-mobile/actions/workflows/release.yml/badge.svg" alt="Build status"></a>
  <a href="https://github.com/facebook/react-native"><img src="https://img.shields.io/github/package-json/dependency-version/huangge666/lx-music-mobile/react-native" alt="React Native version"></a>
  <a href="https://github.com/huangge666/lx-music-mobile/blob/master/package.json"><img src="https://img.shields.io/github/package-json/v/huangge666/lx-music-mobile/master" alt="Package version"></a>
</p>

<p align="center">基于 React Native 的开源音乐播放器，支持 Android 手机与平板设备。</p>

## 项目说明

本仓库是 [lyswhut/lx-music-mobile](https://github.com/lyswhut/lx-music-mobile) 的衍生仓库，在上游项目基础上合并了功能与体验改动。当前仓库的 Release、Issue 与自动化构建结果以本仓库为准。

当前版本：`20260828_2`（版本号来源于 `package.json`，并与 `publish/version.json` 保持同步）。完整变更记录请查看 [CHANGELOG.md](CHANGELOG.md)。

### 主要功能

- 聚合搜索、歌单与排行榜浏览，以及多音源切换。
- 播放详情、歌词、翻译歌词、罗马音歌词、评论和桌面歌词。
- 我的列表、试听列表、稍后播放、收藏歌单和歌曲换源。
- 在线歌曲下载到本地，支持下载音质、封面、歌词与保存路径设置。
- Android 下载目录为系统公共目录 `Download/lxmusic`，下载完成后会主动通知媒体库扫描；iOS 路径为应用沙盒 `Documents/download/lxmusic`。
- 动态背景、多主题、横竖屏布局、后台播放、通知栏媒体控制与播放队列。
- 通过独立的 [数据同步服务](https://github.com/lyswhut/lx-music-sync-server) 在受信任的网络中同步多端列表。

### 本仓库的定制内容

| 模块 | 说明 |
| --- | --- |
| 底部导航 | 横屏与竖屏首页接入 `BottomBar`，并增加下载页签。 |
| 下载能力 | 在线列表、我的歌单列表支持下载，核心逻辑位于 `src/core/music/downloader.ts`。 |
| 下载路径与权限 | Android 使用 `Download/lxmusic`，写入前申请存储权限；拒绝权限时提供系统设置引导。 |
| 取链与音质 | 下载音质跟随“设置 → 播放音质”，请求会携带常见 `Referer` 以减少高码率直链失败。 |
| 播放体验 | 增加下一首歌曲 URL 预取、有限延迟重试和稳定随机播放队列，降低切歌等待与重复播放。 |
| 界面体验 | 设置页、播放详情页、歌单页、排行榜页、侧边栏及底部操作栏持续进行沉浸式交互优化。 |

## 下载与支持平台

- 下载地址：[GitHub Releases](https://github.com/huangge666/lx-music-mobile/releases)
- 常见问题：[FAQ.md](FAQ.md) 或 [在线文档](https://lyswhut.github.io/lx-music-doc/mobile/faq)
- 目前官方发布流程以 Android APK 为主，最低支持 Android 5（API 21）。
- 仓库保留 iOS 工程与脚本，但当前 CI 和官方 Release 未提供 iOS 安装包。
- 桌面版项目：[lx-music-desktop](https://github.com/lyswhut/lx-music-desktop)
- 项目发展说明：[Issue #1912](https://github.com/lyswhut/lx-music-desktop/issues/1912)

请仅从本仓库主页列出的地址下载。其他渠道的安装包可能是第三方转载或修改版本，与本项目无关。

## 本地开发

### 环境要求

- Node.js `18` 或更高版本（仓库提供 `.nvmrc`）。
- npm `8.5.2` 或更高版本。
- Android Studio、Android SDK、Android SDK Platform 36、Android SDK Build-Tools 35.0.0。
- JDK、Android SDK 与模拟器或已开启开发者选项的 Android 设备。

建议先按照 [移动版源码使用文档](https://lyswhut.github.io/lx-music-doc/mobile/use-source-code) 配置 React Native 环境。

### 安装依赖并运行

```bash
git clone https://github.com/huangge666/lx-music-mobile.git
cd lx-music-mobile
npm install

# 启动 Metro
npm run start

# 在另一终端运行 Android Debug 版本
npm run dev
```

常用命令：

```bash
npm run lint                 # ESLint 检查
npm run lint:fix             # 自动修复可修复的 ESLint 问题
npm run build:theme          # 重新生成主题文件
npm run clear                # 清理 Android 构建缓存
npm run sc                   # 清理 Metro 缓存后启动
```

### 构建 Android APK

Debug 构建：

```bash
cd android
./gradlew assembleDebug
```

Windows PowerShell 或 CMD：

```powershell
cd android
gradlew.bat assembleDebug
```

Release 构建：

```bash
npm run pack:android
```

Release 构建会按 ABI 输出 `arm64-v8a`、`armeabi-v7a`、`x86`、`x86_64` 及 `universal` 安装包。正式发布前请配置自己的签名文件；未配置时 Gradle 会回退到调试签名，仅适合本地验证。

## GitHub Actions 发布

仓库包含两个工作流：

- `.github/workflows/sync-upstream.yml`：每天 UTC 18:00（北京时间次日 02:00）同步 `lyswhut/lx-music-mobile` 的 `master` 分支，也支持手动触发。
- `.github/workflows/release.yml`：在 `master` 推送或手动触发时构建多 ABI Android APK，并创建 GitHub Release。Tag 使用 `package.json` 的版本号并添加 `v` 前缀。

### Release 所需 Secrets

在 GitHub 的 **Settings → Secrets and variables → Actions** 中配置：

| Secret | 用途 | 必需 |
| --- | --- | --- |
| `KEYSTORE_STORE_FILE_BASE64` | Android 签名 keystore 的 base64 内容 | 是 |
| `KEYSTORE_STORE_FILE` | keystore 文件名 | 是 |
| `KEYSTORE_KEY_ALIAS` | key alias | 是 |
| `KEYSTORE_PASSWORD` | keystore 密码 | 是 |
| `KEYSTORE_KEY_PASSWORD` | key 密码 | 是 |
| `SYNC_TOKEN` | 上游同步后推送并触发后续 workflow 的 Fine-grained PAT | 否，建议配置 |

工作流同时兼容带 `MASTER_` 前缀的签名 Secret。`SYNC_TOKEN` 未配置时会回退到 `GITHUB_TOKEN`，并尝试通过 `workflow_dispatch` 触发 Release。

手动发布路径：打开 **Actions → Build → Run workflow**，即可基于当前 `master` 构建并发布；同步上游则进入 **Actions → Sync Upstream → Run workflow**。

### 手动同步上游

```bash
git remote add upstream https://github.com/lyswhut/lx-music-mobile.git
git fetch upstream
git merge upstream/master
```

## 相关文档

- [更新日志](CHANGELOG.md)
- [常见问题](FAQ.md)
- [移动版在线文档](https://lyswhut.github.io/lx-music-doc/mobile)
- [数据同步服务](https://github.com/lyswhut/lx-music-sync-server#readme)

## 贡献代码

欢迎提交 Issue 与 Pull Request。为了便于维护：

- 新功能建议先创建 Issue，确认需求和实现方向。
- Bug 修复请提供复现步骤、预期行为、实际行为及修复说明。
- UI 或交互调整请附上必要的截图或录屏，并说明影响的平台与屏幕方向。
- 源码开发请基于 `dev` 分支，并将 PR 提交到 `dev` 分支。

## 项目协议

本项目基于 [Apache License 2.0](LICENSE) 许可证发行，以下协议是对于 Apache License 2.0 的补充，如有冲突，以以下协议为准。

---

*词语约定：本协议中的“本项目”指 LX Music（洛雪音乐）移动版项目；“使用者”指签署本协议的使用者；“官方音乐平台”指对本项目内置的包括酷我、酷狗、咪咕等音乐源的官方平台统称；“版权数据”指包括但不限于图像、音频、名字等在内的他人拥有所属版权的数据。*

### 一、数据来源

1.1 本项目的各官方平台在线数据来源原理是从其公开服务器中拉取数据（与未登录状态在官方平台 APP 获取的数据相同），经过对数据简单地筛选与合并后进行展示，因此本项目不对数据的合法性、准确性负责。

1.2 本项目本身没有获取某个音频数据的能力，本项目使用的在线音频数据来源来自软件设置内“自定义源”设置所选择的“源”返回的在线链接。例如播放某首歌，本项目所做的只是将希望播放的歌曲名、艺术家等信息传递给“源”，若“源”返回了一个链接，则本项目将认为这就是该歌曲的音频数据而进行使用，至于这是不是正确的音频数据本项目无法校验其准确性，所以使用本项目的过程中可能会出现希望播放的音频与实际播放的音频不对应或者无法播放的问题。

1.3 本项目的非官方平台数据（例如“我的列表”内列表）来自使用者本地系统或者使用者连接的同步服务，本项目不对这些数据的合法性、准确性负责。

### 二、版权数据

2.1 使用本项目的过程中可能会产生版权数据。对于这些版权数据，本项目不拥有它们的所有权。为了避免侵权，使用者务必在 **24 小时内** 清除使用本项目的过程中所产生的版权数据。

### 三、音乐平台别名

3.1 本项目内的官方音乐平台别名为本项目内对官方音乐平台的一个称呼，不包含恶意。如果官方音乐平台觉得不妥，可联系本项目更改或移除。

### 四、资源使用

4.1 本项目内使用的部分包括但不限于字体、图片等资源来源于互联网。如果出现侵权可联系本项目移除。

### 五、免责声明

5.1 由于使用本项目产生的包括由于本协议或由于使用或无法使用本项目而引起的任何性质的任何直接、间接、特殊、偶然或结果性损害（包括但不限于因商誉损失、停工、计算机故障或故障引起的损害赔偿，或任何及所有其他商业损害或损失）由使用者负责。

### 六、使用限制

6.1 本项目完全免费，且开源发布于 GitHub 面向全世界人用作对技术的学习交流。本项目不对项目内的技术可能存在违反当地法律法规的行为作保证。

6.2 **禁止在违反当地法律法规的情况下使用本项目。** 对于使用者在明知或不知当地法律法规不允许的情况下使用本项目所造成的任何违法违规行为由使用者承担，本项目不承担由此造成的任何直接、间接、特殊、偶然或结果性责任。

### 七、版权保护

7.1 音乐平台不易，请尊重版权，支持正版。

### 八、非商业性质

8.1 本项目仅用于对技术可行性的探索及研究，不接受任何商业（包括但不限于广告等）合作及捐赠。

### 九、接受协议

9.1 若你使用了本项目，即代表你接受本协议。

---

如有协议相关疑问，请 mail to: lyswhut+qq.com（请将 `+` 替换成 `@`）。
