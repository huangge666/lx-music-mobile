# 核心版：让歌单、搜索、播放和下载形成一条完整路径

当前范围由 2026-11-14 的用户目标确定：只保留歌单、歌单导入、音源、听歌、搜索和下载。2026-11-15 已完成核心功能重构与 Android Preview 验证，项目版本仍为 2.1.9。本次 Git 交付分支为 `codex/core-refactor`，正式版本尚未发布。

**试用入口：** 安装 `android/app/build/outputs/apk/preview/lx-music-mobile-v2.1.9-universal.apk`。Preview 与正式版独立存储；已有 Preview 用覆盖安装更新，不要卸载或清除数据。

## 四个首页标签，六组必要设置

- 首页：我的歌单、在线歌单、搜索、下载。默认进入我的歌单；保留页面的历史状态原样恢复，已移除页面回到默认页。
- 设置：音源、基本、播放、搜索、列表、下载。原生导航负责设置子页返回。
- 播放保留本地/在线音频、队列、收藏、稍后播放、播放模式、页内歌词和通知栏控制。
- 导入保留分享链接、纯 ID、深链接与 `.json` / `.lxmc` / `.bin` 文件；单歌单菜单继续提供导出。
- 移除排行榜、评论、多端同步、桌面/蓝牙歌词、定时退出、应用内更新及其专属界面、状态、SDK、原生桥和翻译文案。

## 统一视觉与真实交互

大标题、纸感浅色/深色背景、唱片主视觉、语义化色板、Lucide 图标和浮动玻璃操作层构成统一界面。操作区采用独立触控目标，大字号下歌曲行随文本高度增长；低动态效果偏好由已有动画逻辑尊重。

- 横屏侧栏使用固定 dp 的操作几何，四个标签可滚动，设置固定在底部；1.3 倍应用字号下四个标签与设置均完整可见。
- 横屏资料库主视觉采用标题、数量、打开操作的横向排布；详情封面限制为 104dp，让首屏同时显示播放操作和歌曲。
- 本地与在线歌曲列表订阅窗口尺寸，旋转时更新列数与原生列表 key；竖屏 → 横屏 → 竖屏恢复单列，不必重载歌单或搜索。
- 下载页的浮动播放器恢复真实内容，不再留下空玻璃条；页面容器统一决定播放器是否挂载。

玻璃层使用项目现有半透明、高光和模糊能力，不把所有设备上的降级外观描述成完全相同的原生材质。界面自有文案不包含表情符号。

## 不改数据含义，失败不冒充成功

- 存储前缀与歌单数据格式保持不变，旧歌单、音源及下载文件不清理。
- 单歌单文件导入复制输入，等持久化成功后才结束；重复文件可另存或确认替换歌曲。
- 批量导入先校验所有歌单，未知格式和损坏项在写入前停止导入；无关本地歌单继续保留。多个持久化操作仍不是一个事务，写入中断的限制见下方。
- 在线导入、收藏与收藏状态共用 `src/utils/songlistId.ts`：复用 SDK 的直链规则，将常见链接与对应纯 ID 归为同一身份。兼容历史纯 ID / 完整 URL，不改写已有用户数据；不同平台相同 ID 不互相覆盖。
- 酷狗分享码、酷我专辑/波点标识与网易 `###` 私有授权后缀保留原语义。重复在线歌单进入更新原歌单的确认流程，取消不更新、不提示成功。本次不合并历史上已有的重复副本。
- 音源本地/在线导入等待真实写入，错误只报告一次；在线下载和保存使用同一提交锁。所有入口共用最多保存 20 个、同时启用 5 个音源的限制；空、非字符串及过大的脚本在存储前拒绝。
- 在线歌单更新位于 `src/core/updateImportedList.ts`；文件导入导出位于 `src/core/listImportExport.ts`。
- 保留播放器用户暂停、播放请求、等待取链和自动切歌锁，删除的只有定时退出专用状态。

## 构建与检查

```powershell
npm test
npm run typecheck
npm run lint
git diff --check
.\android\gradlew.bat -p android assemblePreview -PreactNativeArchitectures=x86_64
```

本地工具链：Node 22.23.4、JDK 17.0.20、Android SDK 36 / Build-Tools 35.0.0。没有新增或升级依赖；移除同步专用的 `message2call` 依赖及危险的 `clear:full` 脚本。Gradle 解析既有版本，保留其弃用警告。

Preview 使用调试签名、内置 production JS 和独立包名 `cn.toside.music.mobile.preview`。最终构建成功，用时 1 分 11 秒，并通过 `adb install -r` 覆盖安装 x86_64 包。正式包 `cn.toside.music.mobile` 未改动。

| APK | 用途 | 大小 |
| --- | --- | --- |
| `lx-music-mobile-v2.1.9-universal.apk` | 通用预览包，包含 arm64-v8a、armeabi-v7a、x86、x86_64 原生库 | 50,481,311 字节 |
| `lx-music-mobile-v2.1.9-x86_64.apk` | 本次模拟器实际安装与验收的预览包 | 23,430,195 字节 |

两份产物均在 `android/app/build/outputs/apk/preview`。ABI 内容已检查，设备运行证据来自 x86_64；不要把 Preview 用于正式版升级。

### Git 交付与发布分开

源码、回归测试与说明文档提交到 `codex/core-refactor`，APK、测试日志和设备截图留在本地构建目录。推送该分支不会触发现有的正式发版流程。

`master` 推送会触发主线 APK 发布，并同步到小米分支；应在确认发布与补完必要验收后再合并。此次 Git 交付不改版本号、不创建标签、不发布 APK。

## 核心路径的实际验收

测试设备为 Android API 25、x86_64、720×1280，横屏为 1280×720。**115 项 Node 回归、TypeScript、全量 ESLint 与 `git diff --check` 均通过。** 源码检查覆盖兼容导入、持久化等待、失败/取消反馈、音源上限、身份归一化、旋转列数与设计系统；设备证据覆盖下列实际入口。

下表中的文件均位于 `android/app/build/core-qa`，截图同时保存对应 UI XML。

| 路径 | 结果 | 主要证据 |
| --- | --- | --- |
| 歌单文件导入 | 真实选择器导入 `playListPart_v2`，得到 `CORE / 功能验收` 三首歌；原有 25 首在线歌单仍在 | `file-import-result.png`、`home-fixture-imported.png` |
| 在线分享导入 | 完整文案 `分享歌单 https://www.kuwo.cn/playlist_detail/2886046289。` 原样输入，识别已有 25 首歌单，确认后更新原歌单 | `candidate-share-text.png`、`candidate-url-duplicate.png`、`candidate-url-update.png` |
| 音源 | `.js` 本地文件与 HTTP 在线入口导入成功；启用后初始化成功 | `source-imported.png`、`source-online-result.png`、`source-enabled.png` |
| 听歌与队列 | 本地 WAV、音源解析的 HTTP WAV、已下载文件可播放；暂停、手动下一曲与三首队列已操作；页内定时歌词在横竖屏可用 | `accepted-local-session.txt`、`online-play-session.txt`、`accepted-pause-session.txt`、`next-session.txt`、`download-play-session.txt`、`player-queue.png`、`lyrics-player-page.png`、`player-landscape-lyrics.png` |
| 搜索与在线浏览 | 真实歌曲/歌单搜索及酷我在线歌单返回结果；部分平台失败的提示与重试入口保留 | `search-music-results.png`、`search-playlist-results.png`、`accepted-search-results.png`、`online-browse-final.png` |
| 下载失败与重试 | 可控 HTTP 503 显示失败原因与重试；服务恢复后点击重试，下载完成，生成 529,244 字节 WAV；原有下载文件保留 | `controlled-download-error.png`、`controlled-download-retried.png`、`closure-final-download.png` |
| 旋转与大字号 | 本地详情竖屏 → 横屏 → 竖屏恢复单列；最终侧栏、资料库及详情在 1.3 倍应用字号下无操作裁切 | `latest-detail-portrait.png`、`latest-detail-landscape.png`、`latest-detail-rotation-return.png`、`accepted-landscape-130-library.png`、`closure-landscape-130-detail-top.png` |
| 恢复与暂停 | 覆盖安装后的启动恢复歌曲信息且保持暂停；最终操作未改变当前歌曲、暂停态或进度 | `final-startup-session.txt`、`closure-preserved-player-session.txt` |

回归日志为 `final-tests.log`、`final-typecheck.log`、`final-lint.log`；最终构建日志为 `android/app/build/editorial-qa/core-preview-final-build.log`。这些是本地构建材料，不随仓库提交。

播放和可控失败验收使用自合成 WAV，原生媒体会话确认本地/HTTP 音轨及 12 秒时长。它们验证客户端播放与下载路径，不代表外部音源的资源覆盖或真实音质。外部搜索、歌单访问按上述真实结果记录；音频质量标签的既有问题见下方。

验收结束后停止本机测试音频服务、移除其 ADB reverse，测试音源均关闭；现有非测试音源保持启用。应用停在下载页，当前歌曲 `Call You Tonight` 保持暂停，原生 position 为 3,701ms；应用字号恢复为标准，横竖屏和键盘设置恢复为验收前状态。

### 真机软键盘布局尚待验收

当前模拟器仅提供 MemuIME。聚焦搜索时系统报告 `mInputShown=true`、`mWindowVisible=true`，但没有实际键盘按键或缩小的可视区域，`accepted-search-focused.png` 因而只证明输入框聚焦。回归验证了键盘状态下隐藏浮动播放器，尚未验证真实软键盘的遮挡、收起和可用空间。

正式发布前需在真实 Android 软键盘环境补验搜索与导入输入；本次不为此安装新的输入法或工具。iOS 与其他 ABI 的设备运行也未验收。

## 保留功能的既有风险

当前任务未改变正式发布策略、签名流程、iOS 原生支持或依赖主版本。下列历史问题仍影响正式发布与故障恢复：

- **音源初始化/删除生命周期：** 不发送 init 的脚本可能阻塞后续音源；删除或切换仍缺完整运行时清理。导入并初始化成功的脚本已实测，但静默或异常脚本的恢复仍需修复。
- **跨操作歌单事务：** 格式校验与持久化等待已落实，多个数据写入尚非原子事务；写入中途故障可留下不一致，重要数据先导出备份。
- **中断下载恢复：** 普通失败重试已实测；强杀进程留下的残缺音频可能被重启扫描当成已完成。它与 HTTP 失败后点击重试是不同路径。
- **实际音质与标签：** 降级/换源后仍可能显示请求音质而非实际音质；本次 WAV 验收中的 `320k` 标签也不能用于判断真实码率。
- **发布、依赖与 iOS：** 既有签名回退、发布链路与依赖审计问题未处理，未运行正式发布；iOS 保留工程但没有本次构建或设备证据。

详细历史依据见 [项目审计](project-audit.md) 中仍适用的条目。已移除功能的风险、旧 UI 阶段与旧检查数量不再作为当前待办。
