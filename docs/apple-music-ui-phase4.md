# Phase 4 交接记录：资料库封面网格与两种歌单详情

对应 `docs/apple-music-ui.md` 第 6 节 Phase 4（4A 资料库/浏览、4B Hero/随机动作）。本记录只描述本轮实际改动的代码与验证结果；**未做真机视觉验收，Phase 4A/4B 在总方案的执行状态里保持未勾选**。

本轮只动 UI 与页面动作层，未改播放内核、取链/保活、音源 SDK、列表虚拟化参数（`windowSize` / `maxToRenderPerBatch` 保持原值）。

## 改动文件

| 文件 | 改动 |
|---|---|
| `src/components/common/PlaylistHero.tsx`（新增） | 歌单主视觉共享组件：封面/占位、简介（可展开）、歌曲数与来源、加载/失败态、播放/随机/收藏/更多动作；封面尺寸由实测容器宽度决定（`onLayout` 值不再交给缩放工具）；只接收展示数据与回调，不订阅播放器或歌单 store |
| `src/components/common/playlistCover.ts`（新增） | 本地歌单没有 cover/createdAt 字段，按稳定 id 派生固定色相占位 + 标题首字；纯函数，便于回归 |
| `src/screens/Home/Views/Mylist/MyList/gridLayout.ts`（新增） | 资料库网格纯几何计算：列数、卡片宽度、卡片高度、行高（含标题块与歌曲数块） |
| `src/utils/shuffle.ts`（新增） | 随机播放起点计算，保证落在 `[0, length-1]` |
| `src/screens/Home/Views/Mylist/MyList/List.tsx` | 单列行列表改为封面卡片网格：容器测量决定列宽，竖屏两列、宽屏按 `minCardWidth` 增列；`getItemLayout` 用同一份行高；旧像素位置在缺少布局记录时只重置资料库这一处；保留卡片更多菜单与「新建列表」入口 |
| `src/screens/Home/Views/Mylist/MusicList/List.tsx` | 支持 `ListHeaderComponent`，包裹层实测头部高度并计入 `getItemLayout` 偏移（`scrollToIndex` 定位随之正确） |
| `src/screens/Home/Views/Mylist/MusicList/index.tsx` | 透传 `ListHeaderComponent` |
| `src/screens/Home/Views/Mylist/MusicList/listAction.ts` | 新增 `handleShufflePlay`：先读真实歌单校验非空 → 切 `random` 模式 → 用随机起点 `playList` |
| `src/screens/MylistDetail/index.tsx` | 接入 PlaylistHero 作为列表头，播放全部沿用原动作，随机走真实随机；busy 期间禁止重复点击 |
| `src/screens/SonglistDetail/Header.tsx` | 改为 PlaylistHero 的数据适配层：保留共享元素 nativeID、播放量角标、简介展开；新增 `setStatus` 与失败重试 |
| `src/screens/SonglistDetail/usePlaylistActions.ts`（新增） | 在线歌单的动作层：播放（沿用原逻辑）、真实随机（`getListDetailAll` → `setTempList` → 切 `random` → 随机起点播放）、收藏状态 |
| `src/screens/SonglistDetail/ActionBar.tsx`（删除） | UI 由 PlaylistHero 的动作行取代，业务逻辑迁到 `usePlaylistActions`，避免同一套按钮逻辑两份 |
| `src/screens/SonglistDetail/MusicList.tsx` | 列表状态同步给主视觉（`refreshing/loading` → 加载占位，`error` → 可点重试）；`onRetry` 复用列表刷新 |
| `src/components/OnlineList/List.tsx` | `ListHeaderComponent` 改为 `ReactNode` 并包裹测量高度，`getItemLayout` 偏移计入头部高度 |
| `src/screens/Home/Views/SongList/components/Songlist/List.tsx` | 浏览网格与资料库统一间距：左右内容 16、列间距 12，列宽/列数/间距出自同一份计算 |
| `src/screens/Home/Views/SongList/components/Songlist/ListItem.tsx` | 列宽由列表统一给出，去掉自身 `- gap` 与左右 `marginHorizontal` |
| `src/utils/data.ts` | `getMusicListPosition` 增加 `resetWhenLayoutUnknown` 选项：布局被整体替换时（资料库行列表 → 封面网格）只重置该视图，其它列表位置迁移行为不变 |
| `src/lang/{zh-cn,zh-tw,en-us}.json` | 新增 `playlist_shuffle_failed` |
| `tests/ui-interactions.test.cjs` | 新增网格几何、封面占位、随机起点、位置迁移/重置、文案共 7 条回归 |

## 行为变化与入口

| 位置 | 变化 |
|---|---|
| 资料库（我的） | 单列行 → 封面卡片网格；系统列表（默认列表/我喜欢）用固定图标，用户歌单用稳定色块 + 首字；卡片更多菜单仍在，菜单位置仍按控件实测锚点上报 |
| 资料库滚动位置 | 旧行列表按像素记录的位置不再直接套用：缺少布局记录时只把资料库滚动位置归零；其它列表（歌曲列表等）迁移规则不变 |
| 我的歌单详情 | 顶部新增主视觉（封面/标题/歌曲数/播放全部/随机），随列表滚走；返回栏、列表内搜索、独立迷你播放器保留 |
| 在线歌单详情 | 原头部替换为同一套主视觉；收藏按钮并入动作行，含义不变（收藏/已收藏）；下拉刷新与列表底部加载不变；加载中显示封面占位，失败显示「加载失败，点击重试」并可点击重新拉取 |
| 随机播放 | 我的歌单：真实列表 id + 随机起点 + `player.togglePlayMethod=random`；在线歌单：先取完整歌单成功后再切模式并随机起点开播，取不到内容/页面已离开时不改模式、不动当前队列 |
| 浏览（歌单广场） | 网格仍是真实数据与自适应列数，只是把左右边距/列间距对齐资料库；排行榜仍是覆盖页入口，未改动 |

没有实现的能力：两种详情都未新增「更多」菜单（当前页面本来就没有对应菜单），`PlaylistHero` 的 `onMore` 保持可选且未接入，不用占位按钮冒充；我的歌单详情没有收藏/刷新，因为本地歌单本来就没有这两个能力。

## 用户反馈修正（第二轮）

用户在实际运行后反馈的问题，均已修改：

| 反馈 | 原因 | 修正 |
|---|---|---|
| 点进歌单后按钮文字看不清 | `c-primary-font` 与 `c-primary` 是同一色值（浅色主题都是 `rgb(42,46,54)`，深色主题都是 `rgb(232,236,242)`），我把它当成实底上的文字色，等于同色写字 | 「播放全部」的图标/文字/加载指示改用反色（与 `ButtonPrimary` 相同的 `theme.isDark ? rgb(18,16,14) : rgb(255,255,255)`），不再用 `c-primary-font` |
| 封面太大 | 页头封面取屏宽 44%（上限 196），资料库网格单卡约屏宽 44% | 页头封面比例 0.44 → 0.33（上限 196 → 150，下限 112 → 96），约屏宽 1/3；资料库网格 `minCardWidth` 148 → 100，手机竖屏变成三列小卡（约屏宽 28%）；卡片首字 44 → 34、行间距 18 → 16、更多按钮 28 → 24（hitSlop 12，点按面积仍 ≥48） |
| 封面下的标题要不要占两行 | 网格卡片标题按固定两行块排版 | 改为单行显示（长标题按 `numberOfLines={1}` 截断），标题块高度随之从「间距 + 2×行高」改为「间距 + 行高」，`getItemLayout` 与渲染仍取同一个 `titleBlockHeight` |

修正后仍按原有合同工作：网格列数/列宽/行高仍由同一份测量计算，`getItemLayout` 与渲染同源；尺寸只改设计基准值，没有引入第二套缩放。

## 已执行验证

| 检查 | 结果 |
|---|---|
| `eslint` 定向检查全部改动文件 | 无错误 |
| `npx tsc --noEmit` | 仅剩 2 条既有基线错误，均在未改动的 `src/core/player/player.ts`（651、660 行） |
| `node --test tests/ui-interactions.test.cjs` | 通过，45/45（含本轮新增 7 条） |
| `node --test tests/player-queue.test.cjs` | 通过，11/11（回归） |
| `react-native bundle --platform android --dev true`（输出到系统临时目录） | 打包成功，13 个资源文件 |
| 第二轮修正后重跑 `eslint` / `tsc --noEmit` / `node --test tests/ui-interactions.test.cjs` | 无错误；仅剩同样的 2 条基线错误；45/45 通过 |

## 未验证项与阻塞

- 本轮无设备可用，**没有做任何真机视觉/交互验收**：资料库网格的列宽与文字截断、两种详情主视觉的覆盖区、简介展开后的行高变化、播放量角标与共享元素转场都只在代码层核对。
- 未实测旋转（资料库 `numColumns` 重建后的位置恢复、详情页头部高度重测）、最大应用字号、三键/手势导航安全区。
- 未做改前/改后截图对比。
- 在线大型歌单的随机播放只做了代码路径检查：`getListDetailAll` 全量拉取期间按钮处于 busy，失败会 toast；未在真机验证大歌单耗时与失败表现。
- 资料库网格使用 `key={columns}` 重建列表：旋转后的位置按「首个可见项」换算是设计行为，未在真机确认观感。

## 已知基线问题（不在本轮范围）

- Phase 2 的迷你播放器 / Dock 规则、Phase 5 的正在播放页、Phase 6 的色板都还没做，详情页配色仍沿用现有语义色。
- 资料库卡片的封面占位色只用于占位艺术，不代表主题语义角色；等 Phase 6 统一色板时如需调整，应连同 `playlistCover.ts` 一起复核明暗对比。
- 歌单详情的列表内搜索入口仍只在「我的歌单」存在；在线歌单详情本来就没有列表内搜索，本轮未新增。
