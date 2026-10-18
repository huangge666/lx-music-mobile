# Phase 6 交接记录：色板、辅助页面与横屏统一

对应 `docs/apple-music-ui.md` 第 6 节 Phase 6（6A 色板/辅助组件、6B 横屏/全局视觉复核）。
本轮只做 Phase 6；**没有设备做真机视觉验收**，所以总方案的执行状态里 6A/6B 仍保持未勾选。

本轮未改播放内核、取链/保活、音源 SDK、缓存策略、列表虚拟化参数（`windowSize` / `maxToRenderPerBatch` 未动）、导航框架、持久化/同步格式，未新增依赖，未提交/推送/发版。

## 依赖阶段核对

| 依赖 | 核对结果 |
|---|---|
| Phase 1–3（导航、Dock、歌曲行） | `MAIN_NAV_MENUS` / `normalizeNavId` / `MusicRow` / `BottomInset` 合同未改；横屏改侧栏时沿用同一份主标签定义与 `openLeaderboard()` |
| Phase 4（两种详情） | `PlaylistHero`、`usePlaylistActions`、`handleShufflePlay` 未改播放语义；本轮只把 Hero 的反色文字换成共享 helper |
| Phase 5（正在播放） | 竖屏封面几何 `Vertical/coverSize.ts`、进度归一、沉浸色板 `Immersive` 均保留；本轮把横屏播放页的独立玻璃色板并入主题（见 6A-4） |
| 主题生成链 | `createThemes.js` → `npm run build:theme` → `themes.ts` 流程保留；未手改生成文件 |

## 6A 改动

### 6A-1 语义色板（新增 `src/theme/themes/palette.ts`）

角色与取值（`createSemanticPalette(isDark)` 纯函数，浅/深结构完全一致）：

| 角色 | 浅色 | 深色 | 用途 |
|---|---|---|---|
| `c-content-background` | `rgb(247,247,249)` | `rgb(8,10,14)` | 页面底（浅色近白，深色近黑） |
| `c-card-background` | `rgb(255,255,255)` | `rgb(28,28,30)` | **实色**分组卡、菜单、抬亮浮层 |
| `c-primary-input-background` | `rgba(118,118,128,.12)` | `rgba(118,118,128,.24)` | 输入框、内嵌容器、未选中胶囊、抽屉填充 |
| `c-border-background` / `c-list-header-border-bottom` | `rgba(60,60,67,.14)` / `.12` | `rgba(255,255,255,.10)` | 中性发丝线（原值在浅色下是白色，落在白卡上不可见） |
| `c-accent` / `c-accent-soft` | `rgb(74,112,126)` / `rgba(74,112,126,.14)` | `rgb(214,176,148)` / `rgba(214,176,148,.18)` | 强调、选中、激活图标、主 CTA 实底 |
| `c-danger` / `c-danger-soft` | **新增** `rgb(198,24,44)` / `rgba(198,24,44,.12)` | **新增** `rgb(255,105,97)` / `rgba(255,105,97,.20)` | 删除、失败、重试 |
| `c-glass-*` | 半透白 + 中性发丝边 | 半透黑 + 浅色发丝边 | 仅导航控制区、抽屉、弹层 |

对比度（WCAG，正文 4.5:1）：

| 组合 | 比值 |
|---|---|
| 浅色 `c-accent` 作文字压在页面底 | 4.97:1 |
| 白字压在浅色 `c-accent` 实底 | 5.38:1 |
| 深色 `c-accent` 作文字 / 压反色字 | 9.6:1 |
| 浅色 `c-danger` 作文字压在页面底 | 5.35:1 |
| 深色 `c-danger` 作文字压在 `c-card-background` | 6.04:1 |

危险色只做「文字/图标 + 柔光底」，**不给实底配白字**：深色主题里「可读的红（浅红）」与「白字可读的红」不可兼得，硬配会出现看不清的白字红底。

配套改动：

| 文件 | 改动 |
|---|---|
| `src/theme/themes/index.ts` | `buildActiveThemeColors` 改为 `...createSemanticPalette(isDark)`；仍然派生依赖主色的字色/主色半透明层/按钮色 |
| `src/store/theme/state.ts` | 初始主题态直接用 `createSemanticPalette(false)`，删除旧的 `rgb(92,132,146)` 强调色与旧玻璃值，**首帧不会闪旧色** |
| `src/types/theme.d.ts` | 补 `c-danger` / `c-danger-soft` |
| `src/theme/themes/palette.ts` | 新增 `getOnAccentColor(isDark)`（实底反色字）、`DISABLED_OPACITY`、`getBgPicOverlayColor(isDark)` |
| `src/theme/themes/createThemes.js` | 主题名「浅色玻璃/深色玻璃」→「浅色/深色」（id 仍是 `green`/`black`），并更正文件头注释 |
| `src/components/PageContent.tsx` | 自定义背景图遮罩改用 `getBgPicOverlayColor()`，与内容底色同源，删除硬编码 `rgba(236,240,244,.58)` |

### 6A-2 设置页实色分组（不再有第二套玻璃）

- `components/style.ts`：`useSettingCardStyle` 改为 `c-card-background` + `c-border-background` 发丝线，去掉阴影与 `elevation`。
- `components/Section.tsx`：删除顶部高光条与玻璃底。
- `components/Card.tsx`：卡片内嵌容器改为 `c-primary-input-background`（原来玻璃底叠玻璃）。
- `components/Button.tsx`、`ChoicePills.tsx`：中性填充底；分段器选中块用实色卡片底 + 强调色文字；胶囊选中用 `c-accent-soft` + `c-accent`，并补 `accessibilityRole="radio"` / `accessibilityState`。
- `components/CheckBoxItem.tsx`、`settings/Source/SourceList.tsx`：开关轨道改为 `c-primary-input-background`（关）/ `c-accent`（开），不用再各写一套 `rgba` 近似值；禁用态统一 `DISABLED_OPACITY`（0.45）。
- `components/SettingIcon.tsx`、`InputItem.tsx`、`Vertical/NavList.tsx`、`Horizontal/NavList.tsx`：边框改中性发丝线，图标瓷贴底色用 `c-accent-soft`，chesron/页脚徽标统一强调色。
- `settings/Theme/Theme.tsx`：外观预览条从「白色高光」改成强调色 + 柔光条（浅色下原来不可见）。
- `settings/Source/SourceList.tsx` / `BuiltinList.tsx`：删掉硬编码 `rgba(255,255,255,.05)` / `rgba(118,118,128,.06)` 行底色，选中态改为 `c-accent-soft` + `c-accent` 描边；删除项改用 `c-danger`。
- `settings/Source/ImportBtn.tsx`：「从文件导入」主 CTA 改为 `c-accent` 实底 + `getOnAccentColor()` 反色字，次按钮用 `c-accent` 描边。
- `SettingScreen/index.tsx`、`SourceManager/index.tsx`：返回钮去掉玻璃描边（浅色下不可见）。

### 6A-3 辅助页面与公共控件

| 文件 | 改动 |
|---|---|
| `screens/Home/Views/Download/index.tsx` | 行改为实色卡片底 + 发丝线；失败行 `c-danger-soft` 底、状态文字 `c-danger`；删除按钮 `c-danger-soft` / `c-danger`；进度条改为 `c-border-background` 轨道 + `c-accent` 填充；顶部工具栏不再重复页面标题（标题在独立返回栏），改为「歌曲数 + 刷新」并补读屏标签；加载/空态改用共享 `ListState` |
| `components/common/ListState.tsx` | 新增可选 `title` / `hint` 覆盖文案，让下载页复用同一套空/加载/失败排版（默认行为不变） |
| `components/common/ConfirmAlert.tsx` | 取消键改中性填充底；新增 `confirmDanger`：危险确认键用 `c-danger-soft` 底 + `c-danger` 文字；确认键反色字改走 `getOnAccentColor` |
| `components/common/ActionSheet.tsx` | 删除硬编码 `#FF453A`，危险项用 `c-danger` / `c-danger-soft`；菜单组改实色卡片底 + 发丝线；关闭钮改中性填充；补读屏 role/label/state |
| `components/common/Popup.tsx`、`Dialog.tsx` | 关闭钮从「玻璃面叠玻璃面」改为中性填充底 |
| `components/common/Menu.tsx` | 菜单底从 `c-content-background` 改为 `c-card-background`（浮层抬亮）；禁用项统一 `DISABLED_OPACITY` |
| `components/common/Input.tsx` | 默认底改 `c-primary-input-background`，去掉玻璃描边（搜索框与各处输入跟随） |
| `components/common/ButtonPrimary.tsx`、`PlaylistHero.tsx`、`Search/SearchTypeSelector.tsx` | 实底反色字统一调用 `getOnAccentColor(isDark)`，不再各自写一份 `rgb(18,16,14)` / 白 |
| `components/common/Icon.tsx` | 新增 `refresh` 别名（`RefreshCw` 已存在导入），供下载页刷新按钮使用 |
| 搜索/浏览 chips：`Search/BlankView/HistorySearch`、`HotSearch`、`Search/SearchTypeSelector`、`Home/components/HeaderActions`、`SongList/HeaderBar/index`、`OpenList/index`、`OpenList/Modal`、`Mylist/MyList/ImportSonglist/Modal`、`Mylist/MusicList/MusicToggleModal`、`MultipleModeBar`、`Basic/UserApiEditModal/ScriptImportOnline` | 玻璃底 + 玻璃描边 → `c-primary-input-background`（+ 发丝线），并清掉因此变成「无边框但有 `borderWidth`」的样式 |
| 悬浮控件：`ScrollTopBtn`、`Mylist/MusicList/LocatePlayingBtn`、`SongList/HeaderBar/Tag/CurrentTagBtn` | 玻璃 → `c-card-background` + `c-border-background`，压在内容上也清晰 |
| `components/common/DrawerLayoutFixed.tsx` | 抽屉内缘分界线从白色高光改为中性发丝线（浅色下才看得见） |

### 6A-4 横屏播放页的 macOS 玻璃色板并入主题

- `screens/PlayDetail/macOS.ts`：删除 `getMacGlassBackground` / `getMacGlassBorder` / `getMacChipBackground` / `getMacPressedBackground` 与**从未被引用**的 `MacAccentRed*` 系列；圆角/间距/字号/阴影令牌保留。
- `PlayDetail/Horizontal/{components/Header,Lyric,MoreBtn,Player}.tsx`：卡片改用 `c-card-background` + `c-border-background`，页面不再有主题之外的第三套配色。
- `Immersive` 色板保留并在注释里写明理由：它压在模糊封面 + 深色遮罩之上，语义是「深底浅控件」，与明暗主题的内容底色无关。

## 6B 改动（横屏与自适应）

| 文件 | 改动 |
|---|---|
| `screens/Home/Horizontal/index.tsx` | 横屏不再渲染底部标签栏：主导航与辅助入口统一由侧栏承载，避免同一层级出现两套主导航；迷你播放器仍贴底，设置页继续隐藏播放器 |
| `screens/Home/Horizontal/Aside.tsx` | 侧栏分层：主标签 → 分隔线 → 覆盖页入口（排行榜/下载/设置）→ 分隔线 → 返回桌面/退出；选中态 `c-accent-soft` + 辅色图标 + 发丝线；补 `accessibilityRole`（tab/button）、本地化 `accessibilityLabel`、`accessibilityState.selected` |
| `screens/Home/components/BottomBar.tsx` | 只保留 HomeDock 需要的内容层，删除已无调用方的 `floating` / `embedded` 分支与自有表面 |
| `screens/PlayDetail/Horizontal/Pic.tsx`（+ 新增 `coverSize.ts`） | 封面从「按窗口比例硬算高度」改为「设计值为上限、取容器实测可用空间的较小值」；`onLayout` 上报真实空间，`minHeight: 0` + `overflow: hidden`。修复短屏横屏（约 360dp 高）下封面把「更多按钮 + 播放控制」挤出屏幕、底部被裁掉的问题 |
| `screens/PlayDetail/Horizontal/index.tsx` | 左栏 `leftContent` 改为吃掉剩余空间（`flexGrow: 1`、`minHeight: 0`），`left` 加 `overflow: hidden`，让封面吸收高度缺口 |

## 入口与行为变化（用户可见）

- 浅色主题内容底由偏蓝的 `rgb(236,240,244)` 变为 `rgb(247,247,249)`；卡片/分组改为纯白实色，浅色下能看出层级。
- 强调色在同一色系内加深（`rgb(92,132,146)` → `rgb(74,112,126)`），白字与强调色文字的对比都达到 4.5:1 以上。
- 分隔线、行边框、进度轨道底在浅色下终于可见（原来用白色描边）。
- 删除/失败类操作用统一危险色；`ActionSheet` 不再有硬编码红；下载页删除确认框走危险样式。
- 设置页、搜索 chips、浏览筛选、菜单、弹层控件不再叠玻璃；玻璃只出现在导航栏、抽屉、弹层表面。
- 下载页顶部不再重复一次「下载」标题，改为「N 首 + 刷新」。
- 横屏下主导航只在左侧栏，底部不再出现标签栏；播放页封面在短屏上收缩。
- 主题名显示为「浅色 / 深色」（id 不变，`green`/`black` 兼容保留）。

## 已执行验证

| 检查 | 命令 | 结果 |
|---|---|---|
| 类型检查 | `npx tsc --noEmit` | 仅剩 2 条既有基线错误，均在未改动的 `src/core/player/player.ts`（651、660 行） |
| 主题生成 | `npm run build:theme` | 通过；第一次运行与提交版本**无 diff**（生成文件是同步的），改主题名后只有 2 行 `name` 变化，`themes.ts` 未被手改 |
| 定向 lint | `npx eslint src/screens/Home src/components src/screens/PlayDetail src/theme src/store/theme src/screens/SettingScreen src/screens/SourceManager src/screens/MylistDetail src/screens/SonglistDetail tests/ui-interactions.test.cjs` | 仅剩 8 条既有基线：`Image.tsx` 未使用的 `EmptyPic`、`Typography.js` `no-multi-spaces`、`createThemes.js` `quote-props`（已用 `git show HEAD:` 复核为基线） |
| UI 回归 | `node --test tests/ui-interactions.test.cjs` | 通过 55/55（本轮新增 5 条：色板角色对称与实色、反色字与禁用透明度、初始主题态取同一套角色、横屏封面收敛/回退、`download_empty_hint` 三语言） |
| 队列回归 | `node --test tests/player-queue.test.cjs` | 通过 11/11 |
| 打包 | `npx react-native bundle --platform android --dev true`（输出到系统临时目录） | 打包成功，13 个资源文件 |

## 未验证项与阻塞

- **本轮没有设备**，全部视觉结论来自代码与色值计算：浅色内容底变白后的实际观感、实色分组卡在深色下的抬亮程度、发丝线在小屏上的可见度、`c-accent` 加深后的整体气质都未实测。
- 未验证：深浅切换/跟随系统时的实时重绘（`state_event.themeUpdated` 链路未改，但没在真机上看过切换瞬间）、启动首帧是否真的没有旧色闪现。
- 未验证：自定义/动态背景下的文字可读性（遮罩值改了，但没有真实背景图样本）、抽屉半透明底与新中性发丝线的组合观感。
- 未验证：横屏侧栏分层后的实际点按热区与滚动行为；横屏播放页封面收缩在 360dp/411dp 高设备上的真实几何；旋转过程中侧栏与底栏切换是否有跳变。
- 未验证：三语言长文案、最大应用字号下设置页实色卡片的换行与行高；Android 三键/手势导航下侧栏底部返回/退出是否被系统栏压住。
- 未做改前/改后截图对比（仍无设备，`docs/apple-music-ui.md` 第 0.1 节要求的基线截图继续缺失）。
- 无障碍改动只到「补 role/label/state」层面，未用 TalkBack 实机验证朗读顺序。

## 已知基线问题（不在本轮范围）

- `src/components/common/Image.tsx` 的 `EmptyPic` 是死代码（占位改由调用方负责），本次只定位未删除，避免在 Phase 6 扩大改动面；它同时是定向 lint 的既有报错源。
- `src/theme/Typography.js` 的 `no-multi-spaces`、`src/theme/themes/createThemes.js` 的 `quote-props` 均为本轮之前就存在。
- `src/core/player/player.ts` 两条 `TS18047` 是既有基线。
- 设置页内仍有一部分「文字强调」使用 `c-primary`（如版本号、FAQ 链接、歌词桌面数值）。它们是主题驱动的可读色，不属于旧主题孤岛；若要彻底收敛到 `c-accent`，建议和设计一起决定后再统一替换，避免本轮把强调色语义改两次。
- 竖屏 `PlayDetail/Vertical` 的沉浸色板、评论页吸顶标签栏仍使用模块内固定值/玻璃，属于「深底浅控件」与导航控制区语义，未强行并入主题色。
- 详情页（我的/在线歌单）横屏仍是全宽列表，未做 iPad 式居中列宽约束；这属于新的布局设计，未在本轮擅自引入。
