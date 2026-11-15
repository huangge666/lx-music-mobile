# 项目审计与修复记录

**历史审计：以下结论与数量对应 2026-11-13 的候选。** 2026-11-14 已按核心目标移除排行榜、评论、同步、桌面歌词与应用更新；相关风险和已删除路径不再作为现行待办。在线歌单更新迁至 `src/core/updateImportedList.ts`，歌单导入导出迁至 `src/core/listImportExport.ts`。当前范围、检查和 Android 验收见 [核心版说明](core-refactor.md)，保留功能的未解决项仍按其实际影响处理。

审计日期：2026-11-13。项目版本：2.1.9。工作目录：`F:\work\Project\fork\lx-music-mobile`。

## 结论：确定性故障已修复，发布与跨操作一致性应优先处理

这是一个以 Android 为主要交付平台的 React Native 音乐播放器，支持在线取链、本地播放、歌单、下载、自定义音源及多端同步。本次按单设备、单用户、数千首歌曲、两个并行下载及多个启用音源的实际负载审查；不把它当成高并发服务器。

已修复能够从源码和回归用例确定的问题，新增 51 项测试。剩余问题按固定编号列在下方，可以直接按编号安排后续修复。优先顺序建议为：**发布链路（2–5）→ 歌单一致性（6）→ 音源与同步生命周期（8–10）→ 下载恢复（11）**。在处理前，不要运行 `clear:full`，不要把无正式签名配置的 Release 包用于正式升级。

### 审查范围与证据边界

- 起始清单包含 804 个受版本控制的文件。检查入口、依赖、配置、CI、文档和本地引用关系；深入追踪启动、存储与迁移、列表事件、备份、下载、播放与预热、搜索、QuickJS、自定义音源、同步、主题及版本发布路径。
- 使用 CodeGraph 定位符号、调用方和源码；索引未覆盖或返回不匹配时，补充定向源码阅读和全树引用检查。删除候选检查了脚本、配置、动态/字符串引用和直接消费者。
- 没有逐行阅读每份静态资源、历史记录或第三方 SDK 文件。外部音乐服务未逐一实测，UI 也未在设备上完成视觉与交互验收。
- 改动留在工作区，未提交或推送；未发布、升级依赖、运行破坏性清理或读取签名凭据。

## 已完成的修复

### 数据写入与歌单操作

- [storage.ts](F:/work/Project/fork/lx-music-mobile/src/plugins/storage.ts)：分片保存改为先事务写入新值，再回收旧分片；磁盘写入失败保留旧值。兼容两种历史分片标记，处理大值变小值的回收和整分片边界，并串行协调读取、写入及删除，避免 NextStorage 并发回收造成读坏数据。
- 回收失败只记录告警，不把已经提交的数据误报为保存失败。已核对当前 Android AsyncStorage 的 SQLite/Room 事务实现。**代价：小值保存也会先读取旧主键；这是数据安全换取的一次额外读取，不是零成本性能优化。**
- [listManage.ts](F:/work/Project/fork/lx-music-mobile/src/utils/listManage.ts)：未加载歌单的删除仍通知消费者并清除位置/更新元数据；全量覆盖纳入新加载和被删除的列表，也恢复之前未加载的临时列表。跨列表移动先加载目标，目标读取失败不再先删除来源；同列表移动不改变歌曲顺序。
- [data.ts](F:/work/Project/fork/lx-music-mobile/src/utils/data.ts)：空的批量保存不再访问不存在的第一项；批量删除音源不再使用音源列表下标修改调用者的 ID 数组、跳过其他待删项。
- [syncSourceList.ts](F:/work/Project/fork/lx-music-mobile/src/core/syncSourceList.ts)：在线列表更新等待歌曲持久化后才返回成功、推进更新时间；重复收藏/导入的三个调用入口返回同步 Promise，让原有错误处理接收到失败。
- [备份 actions.ts](F:/work/Project/fork/lx-music-mobile/src/screens/Home/Views/Setting/settings/Backup/actions.ts)：导出写入失败向上传递，避免失败后仍显示成功。

### 下载、请求与分页

- [downloader.ts](F:/work/Project/fork/lx-music-mobile/src/core/music/downloader.ts)：每个任务拥有取消信号；取链和路径检查期间取消不会再启动文件下载；创建原生任务时立即保存 jobId，不必等 HTTP 响应才可取消。
- 排队任务取消立即结束等待 Promise；删除文件等待原生及标签写入退出；同名并行下载通过内存路径占用表避免互相覆盖。公开任务列表不泄漏内部控制器，下载页允许移除尚无路径的排队任务，并显示文件移除错误。
- [request.js](F:/work/Project/fork/lx-music-mobile/src/utils/request.js) 与 [用户音源 request.js](F:/work/Project/fork/lx-music-mobile/src/core/init/userApi/request.js)：显式取消不再触发备用地址重试；修复 multipart 分支访问不存在的 `form`，由 fetch 生成 boundary；QuickJS JSON 桥侧重建 FormData。选项序列化失败也会清除超时定时器，用户音源请求支持省略 options。
- [version.js](F:/work/Project/fork/lx-music-mobile/src/utils/version.js)：RNFS 返回 HTTP 404/500 时不再交给安装器；尝试下一地址，最终失败则拒绝，并清除下载任务 ID。
- [songlist.ts](F:/work/Project/fork/lx-music-mobile/src/core/songlist.ts) / [leaderboard.ts](F:/work/Project/fork/lx-music-mobile/src/core/leaderboard.ts)：上游页少于本地 30 首时补齐后再返回，保留前一页余量；全量加载由递归拼接改为逐页追加，避免回溯时反复复制整张歌单。测试覆盖 20/50/100 首上游分页及空列表。
- [网易 comment.js](F:/work/Project/fork/lx-music-mobile/src/utils/musicSdk/wy/comment.js)：保存普通/热门评论请求句柄，下一次请求能够取消前一次；修正 `Refere` 为 `Referer`。

### 音源、搜索及公共组件

- [userApi.ts](F:/work/Project/fork/lx-music-mobile/src/core/userApi.ts)：备用音源初始化不再清空正在使用的主音源音质能力；更新“原生只能保留一个脚本”的过时注释，使其与按 apiId 保留独立线程的实现一致。
- [JsHandler.java](F:/work/Project/fork/lx-music-mobile/android/app/src/main/java/cn/toside/music/mobile/userApi/JsHandler.java)：初始化失败包含 apiId，JS 能找到并结束对应等待。
- [UserApiModule.java](F:/work/Project/fork/lx-music-mobile/android/app/src/main/java/cn/toside/music/mobile/userApi/UserApiModule.java)：故障线程通过主线程回报失败；先设置异常处理，再发初始化消息。
- [QuickJS.java](F:/work/Project/fork/lx-music-mobile/android/app/src/main/java/cn/toside/music/mobile/userApi/QuickJS.java)：销毁同时撤销延迟回调，避免回调访问已释放脚本环境；空环境可以安全销毁。
- [ListMusicSearch.tsx](F:/work/Project/fork/lx-music-mobile/src/screens/Home/Views/Mylist/MusicList/ListMusicSearch.tsx)：防抖状态按组件隔离，请求序号阻止同列表旧关键词、关闭、清空或卸载后的慢结果覆盖当前结果；首次动画帧之前关闭也不会重新打开搜索。
- [Image.tsx](F:/work/Project/fork/lx-music-mobile/src/components/common/Image.tsx)：移除未使用的占位组件；使用默认 memo 比较，cache、resizeMode、onError 变化不再被自定义比较器忽略。未添加新的缺图占位行为。
- [log.ts](F:/work/Project/fork/lx-music-mobile/src/utils/log.ts)：日志写入失败用 console 告警，不再形成未处理 Promise 或递归日志故障。
- 修正 [player.ts](F:/work/Project/fork/lx-music-mobile/src/core/player/player.ts) 的空值收窄导致的类型错误，并清理明确的未使用 import、注释间距。

### 发布脚本、检查入口及清理

- [parseChangelog.js](F:/work/Project/fork/lx-music-mobile/publish/utils/parseChangelog.js)：修复日期捕获下标；[updateChangeLog.js](F:/work/Project/fork/lx-music-mobile/publish/utils/updateChangeLog.js) 在首个版本标题前插入新记录，并在修改版本文件前验证 CHANGELOG。
- [release.yml](F:/work/Project/fork/lx-music-mobile/.github/workflows/release.yml)：签名密码、alias 和文件名不再被删除所有空白字符；只有 base64 编码归一化空白。未实际运行发布。
- [package.json](F:/work/Project/fork/lx-music-mobile/package.json)：修正 Windows Debug 打包工作目录，添加 test/typecheck，并让 lint 包含新增的 `.cjs` 测试；[build-test.yml](F:/work/Project/fork/lx-music-mobile/.github/workflows/build-test.yml) 检查 dev/master 的 PR，执行类型与回归测试。
- [.eslintrc.cjs](F:/work/Project/fork/lx-music-mobile/.eslintrc.cjs)：属性引号规则改为允许语义相同的混合写法，保留 Lucide 映射中统一的引号。**这是 lint 风格约定的调整，不是运行时 bug 修复。**
- [README.md](F:/work/Project/fork/lx-music-mobile/README.md)：修正下载音质与播放音质分开保存的说明、工作流数量描述及检查命令。[UI 方案](F:/work/Project/fork/lx-music-mobile/docs/apple-music-ui.md) 中不再声称 test/typecheck 脚本不存在。
- 三份语言文件清理 77 条应用自有文案中的表情符号，保留全部 661 个键及插值参数；第三方评论文本与表情转换未改动。界面图标继续使用既有 Lucide 组件。
- 删除五个无活动消费者的空/注释/备份文件：`dependencies-patch.js`、`src/screens/Home/Views/Setting/settings/Backup/All.js`、`src/screens/Home/Views/Setting/settings/Sync/isEnable.tsx.bak`、`src/store/Provider/Provider.tsx`、`src/utils/hooks/usePlayTime.js`。这些文件共 309 行。

## 待审查：需要优先解决

### 1. `clear:full` 会删除构建缓存之外的本地数据

**位置：** [package.json:23](F:/work/Project/fork/lx-music-mobile/package.json#L23)。

**问题与触发：** `git clean -fdx` 会删除未跟踪和被忽略的文件，只保留两个签名路径模式；运行后可能丢失 local.properties、未提交的新文件或其他位置的签名文件。

**建议与决定：** 删除这一快捷命令，或改为明确的 Gradle/Metro 构建目录清理。未替换它，以便你决定是否保留任何“完整重建”入口。继续保留时，必须把它视为清空工作目录操作，不能用于日常清理。

### 2. 同版本主线发布可能覆盖旧 Release 资产

**位置：** [release.yml:3–7](F:/work/Project/fork/lx-music-mobile/.github/workflows/release.yml#L3)、[48–55](F:/work/Project/fork/lx-music-mobile/.github/workflows/release.yml#L48)、[191–203](F:/work/Project/fork/lx-music-mobile/.github/workflows/release.yml#L191)。

**问题与触发：** 每次 master push 都发布，以 package version 作为 tag 和 APK 文件名。同版本的后续提交可能替换现有资产，而旧 tag 仍指向前次提交，造成源代码和安装包不一致。

**建议与决定：** 正式版改为显式版本/tag 发布，已有 tag 与当前 SHA 不符就停止；持续构建单独放 Actions artifact 或带唯一标识的预发布。需确定你要“稳定版本”还是“每次提交都可下载”，再统一主线、小米和 Beta 策略。

### 3. PAT 同步会触发两次发布，关闭选项也不完全有效

**位置：** [sync-upstream.yml:75–87](F:/work/Project/fork/lx-music-mobile/.github/workflows/sync-upstream.yml#L75)、[sync-master-to-xiaomi.yml:80–90](F:/work/Project/fork/lx-music-mobile/.github/workflows/sync-master-to-xiaomi.yml#L80)。

**问题与触发：** 使用 SYNC_TOKEN/PAT 推送时，push 自动触发 release，脚本又显式 dispatch。同一提交重复构建和上传；`run_release=false` 只能阻止 dispatch，无法阻止 push 触发。发布没有对应的并发互斥配置。

**建议与决定：** 配合第 2 项统一单一触发入口，再加按分支/版本的 concurrency；不要仅删除 dispatch，否则 GITHUB_TOKEN 模式下会失去原本的自动发布。

### 4. Beta/小米签名值仍直接插入 shell 源码

**位置：** [beta-pack.yml:23–27](F:/work/Project/fork/lx-music-mobile/.github/workflows/beta-pack.yml#L23)、[release-xiaomi.yml:37–45](F:/work/Project/fork/lx-music-mobile/.github/workflows/release-xiaomi.yml#L37)。

**问题与触发：** alias/password/路径包含单引号或 shell 字符时可能改变命令语法，造成构建失败甚至执行额外命令。删除临时签名文件也只在构建成功之后执行。

**建议与决定：** 使用 env 传值、变量双引号、退出 trap 清理，与主线共用同一签名处理方案。修复范围应覆盖实际小米分支副本；本次未改远程工作流或查看 secret 内容。

### 5. Release 缺正式密钥时静默采用调试签名

**位置：** [build.gradle:130–154](F:/work/Project/fork/lx-music-mobile/android/app/build.gradle#L130)，[README.md:111](F:/work/Project/fork/lx-music-mobile/README.md#L111)。

**问题与触发：** 无上传签名参数且本地签名文件不存在时，release 配置回退至 debug.keystore。正式包签名会改变，既有用户不能覆盖安装；该行为目前作为本地验证便利明确记录在 README。

**建议与决定：** 正式发布强制签名完整且可用，调试签名仅通过显式本地验证选项启用。需要你确认保留本地 Release 测试入口的方式，不能简单删除回退而破坏已记录用法。

### 6. 歌单全量覆盖不是跨操作事务

**位置：** [listEvent.ts:84–98](F:/work/Project/fork/lx-music-mobile/src/event/listEvent.ts#L84)、[data.ts:401–410](F:/work/Project/fork/lx-music-mobile/src/utils/data.ts#L401)。

**问题与触发：** 内存先改变，用户列表元数据、旧歌曲删除、全部歌曲及数量索引分步持久化。导入/同步中途磁盘失败或进程退出，可留下“新列表元数据 + 旧/缺失歌曲”或数量索引不一致。此次存储修复只保护单次 multiSet，不能把多个调用变成一个事务。

**建议与决定：** 为全量覆盖确定统一提交点：批量写入元数据和歌曲，提交后再发布内存状态、清理旧键与可重建索引；失败保持原状态。需要数据层与事件层一起改，并用中途失败验证恢复，而不是在 UI 加成功提示兜底。

### 7. HTTP/WS 同步没有歌单内容保密性

**位置：** [同步 utils.ts:72–91](F:/work/Project/fork/lx-music-mobile/src/plugins/sync/client/utils.ts#L72)、[95–116](F:/work/Project/fork/lx-music-mobile/src/plugins/sync/client/utils.ts#L95)。

**问题与触发：** `encryptMsg` 实际只按长度 gzip 或直接返回文本；认证加密不等于后续列表传输加密。使用 http/ws 经过不可信网络时，旁路可读取同步内容。

**建议与决定：** 不可信网络使用 HTTPS/WSS；函数名与说明应明确“编码/压缩”。应用层加密必须与同步服务协议一起升级，不能只修改本客户端。README 的“受信任网络”限制仍有效。

### 8. 旧连接的延迟回调可能作用到新同步连接

**位置：** [client.ts:30–140](F:/work/Project/fork/lx-music-mobile/src/plugins/sync/client/client.ts#L30)、[147–275](F:/work/Project/fork/lx-music-mobile/src/plugins/sync/client/client.ts#L147)。

**问题与触发：** 加解码 Promise、open/close 回调及心跳使用可变全局 `client`。断开后迅速连接另一服务时，旧回调可能向新 socket 发送旧请求、关闭新连接或重置新连接状态。

**建议与决定：** 让 socket、定时器和 RPC 对象归属于同一次连接，用连接身份过滤失效回调。协议不需改变，但需真实服务验证断线重连、切地址和慢消息；本次保留整个状态机，避免无设备/服务验证下局部替换。

### 9. 一个不发送 init 的音源能堵住后续初始化

**位置：** [apiSource.ts:58–84](F:/work/Project/fork/lx-music-mobile/src/core/apiSource.ts#L58)。

**问题与触发：** 初始化队列无限等待每个脚本的 initPromise。脚本既不报错也不发送 init 时，后续四个音源不会加载，首源的播放等待也可能一直不结束。修复原生失败事件不能处理这种“静默脚本”。

**建议与决定：** 定义有限初始化期限和明确失败状态；超时结束对应等待并推进队列，迟到 init 按脚本实例身份处理。需确定超时/重试策略，并覆盖慢初始化、删除中初始化、重新启用。

### 10. 音源删除/切换没有完整清理运行时和主源快照

**位置：** [userApi.ts:37–40](F:/work/Project/fork/lx-music-mobile/src/core/userApi.ts#L37)、[SourceList.tsx:191–215](F:/work/Project/fork/lx-music-mobile/src/screens/Home/Views/Setting/settings/Source/SourceList.tsx#L191)、[apiSource.ts:139–158](F:/work/Project/fork/lx-music-mobile/src/core/apiSource.ts#L139)。

**问题与触发：** 删除仅清存储/列表，未销毁对应原生线程、handlers、quality 和 init 快照。删除主源而仍有备用源时，设置先变成备用源，后面的切换条件不再成立；全局主源音质/handler 可仍属于被删源。已有 ready 快照也会阻止重新初始化，却没有总是结束新建的全局等待。

**建议与决定：** 统一删除、停用、主源切换与重启加载的生命周期，明确停用是否保留脚本；切换一次性同步配置、运行时快照和等待状态。必须和第 9 项由同一实现负责人处理。

### 11. 未完成下载重启后会被当作完成文件

**位置：** [downloader.ts:51–53](F:/work/Project/fork/lx-music-mobile/src/core/music/downloader.ts#L51)、[295–358](F:/work/Project/fork/lx-music-mobile/src/core/music/downloader.ts#L295)、[下载页:271–285](F:/work/Project/fork/lx-music-mobile/src/screens/Home/Views/Download/index.tsx#L271)。

**问题与触发：** 状态只在内存；原生下载直接写最终音频路径。断网、取消时选择保留文件或系统杀进程后，残缺文件仍在目录；重启扫描将没有任务对应的文件标为 completed。已修复取消写入/删除竞态，但没有增加恢复协议。

**建议与决定：** 使用可识别的临时扩展名，验证完成后再转为正式文件；定义失败重试时保留/删除部分文件及任务恢复方式。不要默认删除用户选择保留的内容。

### 12. 降级/换源后音质标签和文件信息可能不对应实际音频

**位置：** [online.ts:57–64](F:/work/Project/fork/lx-music-mobile/src/core/music/online.ts#L57)、[音乐 index.ts:22–44](F:/work/Project/fork/lx-music-mobile/src/core/music/index.ts#L22)、[downloader.ts:260–283](F:/work/Project/fork/lx-music-mobile/src/core/music/downloader.ts#L260)。

**问题与触发：** 底层返回实际 quality 和换源歌曲，公共取链函数最终只返回 URL。请求无损后降至 128k 时，下载任务仍显示原请求音质；换源文件也可能继续嵌入原歌曲信息。

**建议与决定：** 保留现有字符串接口，另提供含实际 quality/musicInfo 的解析结果供下载和播放器使用；区分“偏好”与“实际”标签。需统一缓存、预热和显示语义，不能仅替换一处文字。

### 13. 正在加载的分页缓存被淘汰后违反返回合同

**位置：** [songlist.ts:14–24](F:/work/Project/fork/lx-music-mobile/src/core/songlist.ts#L14)、[126–136](F:/work/Project/fork/lx-music-mobile/src/core/songlist.ts#L126)，[leaderboard.ts:35–45](F:/work/Project/fork/lx-music-mobile/src/core/leaderboard.ts#L35)、[76–86](F:/work/Project/fork/lx-music-mobile/src/core/leaderboard.ts#L76)。

**问题与触发：** 缓存上限 12；等待网络时另开 12 个列表，先前缓存会被淘汰。旧请求回调裸 return 得到 undefined，调用方仍按 ListDetailInfo 访问 `.list`/`.total`。

**证据与建议：** 本地隔离复现：挂起 first 请求，完成 12 个不同列表，再返回 first，得到 `Cannot read properties of undefined (reading 'list')`。让请求拥有自己的分页累积状态，缓存淘汰不能取消有效结果；刷新造成的失效应返回明确取消错误。需把淘汰与刷新身份一起整理，不能仅去掉一个判断。

### 14. 依赖审计发现关键/高危条目，不能直接自动升级

**位置：** [package.json](F:/work/Project/fork/lx-music-mobile/package.json)、[package-lock.json](F:/work/Project/fork/lx-music-mobile/package-lock.json)。

**证据：** `npm audit --omit=dev --registry=https://registry.npmjs.org --json` 返回 23 个受影响依赖条目：1 critical、11 high、8 moderate、3 low。默认 npmmirror 审计端点返回 404，结果来自 npmjs。shell-quote（GHSA-w7jw-789q-3m8p）、lodash、ws 等位于依赖链中。

**影响与建议：** 部分为经 React Native 生产依赖链引入的构建工具，不等于 APK 可利用漏洞；需按实际入口和平台判定。先刷新兼容的补丁依赖，再单独安排 RN/导航迁移。npm 提议的 RN 0.88.1 / navigation 8.9.0 跨越当前 0.73.11 / 7.39.2，不能 `npm audit fix --force`。

## 待审查：测试与维护债务

### 15. CHANGELOG 声称的播放队列测试不在仓库

**位置：** [CHANGELOG.md:37](F:/work/Project/fork/lx-music-mobile/CHANGELOG.md#L37)、[playList.ts:194–299](F:/work/Project/fork/lx-music-mobile/src/plugins/player/playList.ts#L194)。

**问题与触发：** 历史记录声称有 11 项队列模拟测试，起始仓库只有加密实验文件及 iOS 模板测试，未找到这些队列测试。新增 51 项也未覆盖原生轨道复用、占位队列和并发切歌状态机；相关回归无法由现有自动检查发现。

**建议：** 找回原测试，或针对当前实现重建最小队列用例；再真机验证连续切歌、重复入队、后台和缓冲失败。不要把日志里的历史测试数量当成当前保障。

### 16. 九份历史 SDK 与部分旧 UI 可以进一步精简

**位置：** [bd 目录](F:/work/Project/fork/lx-music-mobile/src/utils/musicSdk/bd)、[kg/temp](F:/work/Project/fork/lx-music-mobile/src/utils/musicSdk/kg/temp)、[leaderboard-old.js](F:/work/Project/fork/lx-music-mobile/src/utils/musicSdk/mg/temp/leaderboard-old.js)。

**问题与证据：** 这九份文件共 1,698 行，没有活动入口引用；[musicSearch-new.js:2](F:/work/Project/fork/lx-music-mobile/src/utils/musicSdk/kg/temp/musicSearch-new.js#L2) 还导入不存在的 `./util`，不能直接恢复使用。DorpDownPanel、ScaledImage 和旧 UserApiEditModal 容器也没有活动入口；其中部分子组件仍被新版管理页面复用。

**建议与决定：** 确认不再恢复历史供应商后删除九份 SDK；旧 UI 按消费者闭包清理，只删无消费者的容器和专属孩子。**SourceSelector 仍被搜索、横屏排行榜等调用，不属于可删项。**本次只删除五个明确空/备份文件，未批量删除历史功能。无需因此添加或更换依赖。

### 17. iOS 工程不能代表可用的 iOS 支持

**位置：** [iOS 工程](F:/work/Project/fork/lx-music-mobile/ios)、[native utils.ts:3–9](F:/work/Project/fork/lx-music-mobile/src/utils/nativeModules/utils.ts#L3)、[iOS 测试:7–8](F:/work/Project/fork/lx-music-mobile/ios/LxMusicMobileTests/LxMusicMobileTests.m#L7)。

**问题与触发：** 工程里没有 Utils/Crypto/UserApi 的对应自有原生实现，JS 又在导入时直接解引用 UtilsModule；不能据此交付完整功能。模板测试寻找真实应用不存在的 `Welcome to React`，最多等待 600 秒。

**建议与决定：** 继续明确 Android-only，并归档不维护的 iOS 模板；若要支持 iOS，另立可构建、原生桥和真实启动测试的完整平台工作。不要用空 native fallback 隐藏功能缺失。

### 18. UI 方案与运行环境记录仍互相矛盾

**位置：** [apple-music-ui.md:23–69](F:/work/Project/fork/lx-music-mobile/docs/apple-music-ui.md#L23)、[429–440](F:/work/Project/fork/lx-music-mobile/docs/apple-music-ui.md#L429)，[.nvmrc](F:/work/Project/fork/lx-music-mobile/.nvmrc)、[PR workflow:20](F:/work/Project/fork/lx-music-mobile/.github/workflows/build-test.yml#L20)、[setup action:10](F:/work/Project/fork/lx-music-mobile/.github/actions/setup/action.yml#L10)。

**问题与触发：** UI 文档同时使用三/四标签、全宽/玻璃 Dock 的当前合同，引用 phase1/4/5/6/7 交接文件但文件不存在。新执行者按旧阶段会反向覆盖现有设计。发布读取 Node 18，PR 使用 20，本地验证为 22.23.4，检查与交付工具链也不是同一环境。

**建议与决定：** 保留历史阶段作为历史，另标出以当前用户决策为准的有效设计合同；补充真实交接位置或删除失效引用，不虚构验收完成。确定一个受支持的 Node LTS 后统一 PR/发布/README，并实测该版本；本次没有更换运行时或重做 UI。

## 验证结果与使用方法

新增测试使用 Node 内置 test runner 和已安装的 TypeScript 转译器，在 VM 中执行真实项目模块，仅替换 React Native/文件系统/网络边界；没有新增测试框架或依赖。

| 检查 | 结果与范围 |
|---|---|
| `npm test` | 51 项通过：存储 8、下载 5、请求 6、分页 8、歌单 4、搜索 3、发布脚本 4、更新下载 2、备份 2、日志 1、评论 2、用户源 3、语言 1、在线列表同步 2 |
| `npm run typecheck` | TypeScript noEmit 通过 |
| `npm run lint -- --quiet` | 无 ESLint error；包含 `.cjs` 测试。quiet 不表示仓库没有 warning |
| `git diff --check` | 无空白错误 |
| Metro Android production bundle | 当前 JS 候选成功打包，复制 8 份资源 |
| Android `:app:assembleDebug -PreactNativeArchitectures=arm64-v8a` | 自有 Java 修复编译和打包成功；有 Gradle/原生依赖弃用警告 |
| 三语言静态检查 | 每种语言 661 键，键集合相同；应用自有文案无表情；静态 literal 翻译调用未发现缺失键 |

原生 Debug 构建在后续 JS/语言小修之前完成，证明 Java 修复可编译；最新 JS 单独经过 Metro 验证。已有 Debug APK 位于 [debug 输出目录](F:/work/Project/fork/lx-music-mobile/android/app/build/outputs/apk/debug)，不是最终全部改动的安装验收包。最新 production bundle 位于 [index.android.bundle](F:/work/Project/fork/lx-music-mobile/android/app/build/audit/index.android.bundle)。

本地检查入口：

```powershell
npm test
npm run typecheck
npm run lint
git diff --check
```

### 尚未验证且影响交付的部分

- 没有已连接 Android 设备，也没有可用模拟器。权限对话框、下载后媒体扫描/标签、QuickJS 真正执行、播放队列、后台、同步重连及实际视觉状态需要设备验证；单元测试和构建不能替代这些验收。
- 未运行正式签名 Release、GitHub Actions、iOS 构建，也未验证各音乐平台远端接口的当前可用性。发布问题按 2–5 处理后，由发布负责人在实际分支和 CI 上验收；设备行为由 Android 测试负责人验收。
- 依赖公告会随时间变化；此处数字为 2026-11-13 的只读 npmjs 审计结果。后续升级以当时公告、安装锁文件和实际调用路径为准。
