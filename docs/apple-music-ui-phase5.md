# Phase 5 交接记录：正在播放与辅助操作

对应 `docs/apple-music-ui.md` 第 6 节 Phase 5（步骤 1–6 与验收）。本轮只做竖屏「正在播放」页及其辅助控件；**未做真机视觉/交互验收，Phase 5 在总方案的执行状态里保持未勾选**。

本轮未改播放内核、取链/保活、音源 SDK、列表虚拟化参数（`windowSize` / `maxToRenderPerBatch` 未动），未改导航框架，未新增依赖，未提交/推送。

## 依赖阶段核对

| 依赖 | 核对结果 |
|---|---|
| Phase 2 的播放器合同 | `PlayerBar` 已有 embedded 模式与底部 inset 上报（`BottomInset.ts`），本轮未改 |
| Phase 4 的播放动作稳定 | `MylistDetail` / `SonglistDetail` 已接 `PlaylistHero` 与真实随机（`handleShufflePlay` / `usePlaylistActions`），本轮未改 |
| 本轮入口栈 | `pushPlayDetailScreen` 的 push/pop、`sharedElementTransitions`（`playDetail_pic`）与 `elementTransitions`（`playDetail_header` / `playDetail_player`）保持原样，未改 `src/navigation/navigation.ts` |

## 改动文件

| 文件 | 改动 |
|---|---|
| `src/screens/PlayDetail/Vertical/coverSize.ts`（新增） | 封面几何纯函数：设计比例值作为上限，与页面实测可用空间取较小值；无有效测量时回退设计值；圆角随边长等比并封顶 26 |
| `src/screens/PlayDetail/Vertical/Pic.tsx` | 封面尺寸从「窗口百分比硬算」改为「实测可用空间收敛」；容器改为 `flex:1` 由剩余空间决定，`onLayout` 上报；无封面/坏图时渲染同尺寸占位（不再留空洞）；`accessibilityLabel` 改用 i18n（原来是硬编码中文「查看歌词」） |
| `src/screens/PlayDetail/Vertical/Player/components/PlayInfo.tsx` | 进度区重排：轨道行固定高度，加载态与进度条共用同一高度；接入 `common.allowProgressBarSeek`；时长/进度/缓冲全部先归一再进样式与文案；中间槽位在已加载时显示播放状态（缓冲/取链/失败），否则显示音质入口；无曲目且无状态时整块收起 |
| `src/components/player/ProgressBar.tsx` | 新增 `seekable`（默认 `true`）与 `PROGRESS_HEIGHT` 导出；不可拖动时不挂手势层、不画手柄；进度/缓冲/拖拽比例走 `safeProgressRatio`；手柄从约 21pt 收到约 11pt（与 3.6pt 轨道等比）；轨道/留白/手柄在同一套已缩放值上计算，避免 `createStyle` 二次缩放 |
| `src/utils/playTime.ts`（新增） | `safeProgressRatio` / `safePlayTime` / `getRemainTime` 纯函数，NaN、Infinity、负数、越界一律归一 |
| `src/utils/hooks/useDrag.ts` | 容器未布局出宽度（`progressWidth <= 0`）时忽略手势，比例算不出有限值时忽略本次移动；避免 `NaN%` 与把 NaN 提交给 `setProgress` |
| `src/screens/PlayDetail/Vertical/SongTitle.tsx` | 收藏按钮已收藏时心形**实心填充**并用沉浸页强调色；无当前曲目时两个圆钮禁用置灰；补 `accessibilityLabel` / `accessibilityState`（收藏选中态、禁用态）；歌名单行截断时读屏仍给完整歌名 |
| `src/screens/PlayDetail/Vertical/Player/components/ControlBtn.tsx` | 上一首/播放暂停/下一首补本地化读屏文字与 `accessibilityRole`，播放按钮带 `selected` 态 |
| `.../MoreBtn/Btn.tsx` | 工具栏按钮统一支持 `label` / `disabled` / `selected`，禁用态半透明并带 `accessibilityState` |
| `.../MoreBtn/PlayModeBtn.tsx` | 播放模式图标与读屏文字改为同一份映射（原来两处 switch 各写一份），按钮标签随当前模式变化 |
| `.../MoreBtn/DownloadBtn.tsx` | 无当前曲目或本地歌曲时按钮禁用置灰（原来点了才弹「下载失败」）；取目标歌曲的逻辑抽成 `getDownloadTarget`，类型收窄到 `MusicInfoOnline` |
| `.../MoreBtn/CommentBtn.tsx` / `QueueBtn.tsx` | 补读屏文字；评论按钮无曲目时禁用 |
| `src/screens/PlayDetail/Vertical/Lyric.tsx` | 系统「减少动态效果」开启时歌词自动滚动改为直接定位（不做 600ms 缓动）；顶部返回封面的热区 `accessibilityLabel` 改用 i18n |
| `src/screens/PlayDetail/components/QualitySwitchPopup.tsx` | 音质选项补 `accessibilityRole` / `accessibilityLabel` / `accessibilityState`（当前音质为 selected） |
| `src/screens/PlayDetail/macOS.ts` | 新增 `Immersive.accent`（`#FF375F`）：沉浸底色上的收藏激活色，不与主题主色混用（浅色主题下 `c-primary` 是深灰，落在黑底上几乎不可见） |
| `src/lang/{zh-cn,zh-tw,en-us}.json` | 新增 `play_detail_action_prev` / `_next` / `_download` / `_comment` / `_more` |
| `tests/ui-interactions.test.cjs` | 新增 5 条回归：封面几何上限/收敛/回退/圆角、进度与剩余时长归一、新读屏文案三语言齐全 |

## 行为变化与入口

| 位置 | 变化 |
|---|---|
| 大封面 | 尺寸 = min（屏宽 82%／可用高 42% 的设计上限，容器实测可用宽高）。正常手机上视觉与原来一致；小屏、大字号、控制区被撑高时封面收缩，控制按钮不会被挤出屏幕 |
| 无封面 / 封面坏图 | 显示同尺寸半透明占位（音乐图标），不再是一块空白；共享元素 `nativeID` 仍只挂在真实封面上（与迷你播放器一致，无图时两侧都不存在，转场行为与改前相同） |
| 进度条 | 设置「允许拖动进度条」关闭时只展示进度、不显示手柄、不能拖；总时长未知时不画进度条（显示加载状态文字占同高），不会出现 `NaN:NaN` 或 `NaN%` |
| 播放状态 | 已加载后出现的「缓冲中 / 正在取链 / 音频加载出错」显示在时间行中间槽位，不挤掉进度条，也不改变布局高度；未加载时仍用同一块高度显示加载文字 |
| 音质入口 | 只在有当前曲目时出现；切歌后仍可点开音质弹窗 |
| 收藏 | 已收藏 = 实心红心 + 读屏 selected；无曲目时置灰不可点 |
| 下载 | 无曲目 / 本地歌曲：按钮置灰不可点（不再是点击后 toast 失败） |
| 评论 | 无曲目时置灰不可点 |
| 播放模式 | 图标与读屏文字同源，切换时 toast 文案不变 |
| 歌词 | 开关仍在页头（可见按钮 + 文案「歌词 / 封面」）；系统开启减少动态效果时歌词不再缓动滚动 |

未新增能力：交互式下拉收起、卡片展开、实时封面取色均不在本轮范围内，也没有用占位交互冒充。

## 第 5 节「背景复用」核对结论（对应步骤 5）

`src/screens/PlayDetail/Vertical/components/AlbumBackground.tsx` 的实际流程：取 `playerStore.musicInfo.pic` → `ImageBackground` 铺满窗口 → `resizeMode="cover"` + `blurRadius = max(scaleSizeAbsHR(48), 28)` + `transform: scale(1.28)` → 叠一层 `rgba(12,10,16,0.22)` 均匀遮罩；无封面时是纯色 `#1C1420`。

即：**它是「模糊封面图 + 固定遮罩」，没有实时封面取色/主题跟随**。本轮不改这条流程（不在 Phase 5 范围），也不在文档/代码里把它描述成取色背景。若 Phase 6 需要封面主色，需要另外引入取色方案，不能只改组件名。

## 已执行验证

| 检查 | 命令 | 结果 |
|---|---|---|
| 类型检查 | `npx tsc --noEmit` | 仅剩 2 条既有基线错误，均在未改动的 `src/core/player/player.ts`（651、660 行） |
| 定向 lint | `npx eslint src/screens/PlayDetail src/components/player src/utils/hooks/useDrag.ts src/utils/playTime.ts tests/ui-interactions.test.cjs` | 无错误（全仓 `npm run lint` 仍有 `src/utils/musicSdk/wy/**` 等未改动文件的既有 `quote-props` 报错，与本轮无关） |
| UI 回归 | `node --test tests/ui-interactions.test.cjs` | 通过 50/50（含本轮新增 5 条） |
| 队列回归 | `node --test tests/player-queue.test.cjs` | 通过 11/11 |
| 打包 | `npx react-native bundle --platform android --dev true`（输出到系统临时目录） | 打包成功，13 个资源文件 |

## 未验证项与阻塞

- 本轮**没有设备**，所有视觉与手势结论都只来自代码与几何计算：封面收缩后的观感、占位图在深色氛围底上的观感、11pt 手柄的实际手感、红心在浅/深主题下的对比度都未实测。
- 未验证：最小支持屏幕 + 最大应用字号组合下控制区是否仍然完整；旋转（竖屏 `showLyric` 状态会因组件切换重置，属 Phase 6B）；三键/手势导航与系统栏留白；共享元素转场期间封面尺寸从设计值收敛到实测值是否出现可见跳动。
- 未验证：关闭「允许拖动进度条」后是否真的完全不响应手势（代码层已不挂 PanResponder，但没有设备可确认父级是否会拦截/透传）。
- 未做改前/改后截图对比（没有设备，`docs/apple-music-ui.md` 第 0.1 节要求的基线截图在本轮仍缺失）。
- 歌词 reduceMotion 分支只在代码层核对，未在开启该系统的设备上看过实际滚动。

## 已知基线问题（不在本轮范围）

- 全仓 `npm run lint` 的 `src/utils/musicSdk/wy/**` `quote-props` 报错与 `src/core/player/player.ts` 的两条 `TS18047` 都是本轮之前就存在的，未顺手修改。
- `src/screens/PlayDetail/Vertical/Player/components/Status.tsx` 目前没有任何调用方（横屏用的是它自己目录下的 `Status.tsx`），属于既有死代码，本轮未删以免影响别的分支改动。
- 沉浸页仍有一部分模块内固定色（`macOS.ts` 的 `Immersive` 色板、卡片圆底 `rgba(255,255,255,0.08)`），按方案归 Phase 6A 统一；本轮只补了收藏激活色这一个语义色。
- 播放详情竖屏底色、抽屉/弹层（`Popup`、`ActionSheet`）仍是旧玻璃风格，Phase 6A 处理。
- 设置页与被播放详情复用的 `QualitySwitchPopup` 文案与视觉仍跟随旧语义色，Phase 6A 统一。
