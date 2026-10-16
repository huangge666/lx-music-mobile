# Phase 1 交接记录：三标签、入口迁移与导航完整性

对应 `docs/apple-music-ui.md` 第 6 节 Phase 1。本记录只描述本轮实际改动的代码与验证结果，不代表 UI 已按整体方案完成。

## 改动文件

| 文件 | 改动 |
|---|---|
| `src/config/constant.ts` | 新增 `MAIN_NAV_MENUS`（资料库/浏览/搜索唯一顺序）、`MAIN_NAV_IDS`、`DEFAULT_MAIN_NAV_ID`、`DRAWER_NAV_MENUS`、`isMainNavId`、`getMainNavIndex`、`getMainNavIdAt`、`normalizeNavId`；`DEFAULT_SETTING.viewPrevState.id` 默认改为 `nav_love`；`NAV_MENUS` 完整 id 集合不变 |
| `src/store/common/state.ts` | `navActiveId` / `lastNavActiveId` 初始值改为 `DEFAULT_MAIN_NAV_ID` |
| `src/store/common/action.ts` | `setNavActiveId` 仅主标签写入 `lastNavActiveId`（排行榜不再覆盖返回落点） |
| `src/core/common.ts` | `setNavActiveId` 只为主标签持久化；`backToHomeTab` 走 `normalizeNavId`；新增 `openLeaderboard` / `closeLeaderboard` |
| `src/core/init/dataInit.ts` | 恢复值经 `normalizeNavId` 归一化，并把归一化结果写回存储 |
| `src/screens/Home/Vertical/Main.tsx` | 分页器改为三个主标签；排行榜移出分页改为覆盖页；页面懒加载逻辑抽成 `PagerPage`；修正 `homePageScroll` 配置事件与页面事件在覆盖页打开时的行为 |
| `src/screens/Home/Vertical/index.tsx` | 覆盖页隐藏主标签栏；排行榜保留迷你播放器，底部避让按实际 Dock 高度上报 |
| `src/screens/Home/Vertical/Header.tsx` | 去掉左侧汉堡气泡；主标签页头改为「左标题 + 右侧操作」；新增排行榜独立返回栏 |
| `src/screens/Home/Vertical/DrawerNav.tsx` | 抽屉只保留下载/设置与受开关控制的回桌面/退出 |
| `src/screens/Home/components/HeaderActions.tsx`（新增） | 共享的「更多」（打开辅助抽屉）与「排行榜」入口 |
| `src/screens/Home/components/BottomBar.tsx` | 底栏改用 `MAIN_NAV_MENUS` |
| `src/screens/Home/Horizontal/Header.tsx` | 同步三标签页头与排行榜返回栏 |
| `src/screens/Home/Horizontal/index.tsx` | 横屏排行榜同样隐藏主标签栏 |
| `src/screens/Home/Horizontal/Aside.tsx` | 侧栏主标签顺序与共享定义一致；排行榜入口走 `openLeaderboard` |
| `src/screens/Home/Views/Leaderboard/index.tsx` | 新增系统返回：回到浏览；详情压在栈顶时不接管 |
| `src/screens/Home/Views/Leaderboard/Vertical/index.tsx` | 榜单抽屉打开时系统返回先收抽屉 |
| `src/lang/{zh-cn,zh-tw,en-us}.json` | `nav_love`→资料库/資料庫/Library，`nav_songlist`→浏览/瀏覽/Browse，新增 `nav_more` |
| `tests/ui-interactions.test.cjs` | 新增导航归一化、覆盖页返回落点、主标签定义一致性与文案回归 |

## 入口迁移表

| 原入口 | 现入口 |
|---|---|
| 底栏 4 个标签（含排行榜） | 底栏 3 个主标签：资料库 / 浏览 / 搜索 |
| 排行榜 = 分页第 3 页 | 浏览页头右侧「排行榜」按钮 → 覆盖页；返回栏与系统返回回浏览 |
| 左侧汉堡气泡 + 标题点击打开抽屉 | 资料库右上「更多」按钮打开辅助抽屉（边缘滑动仍可用） |
| 抽屉内 6 个菜单（含主标签） | 抽屉只有下载、设置、回桌面、退出；主标签由底栏切换 |
| 资料库页头导入歌单 | 不变，仍是资料库页头右侧 |
| 横屏侧栏 | 保留全部入口，主标签顺序与底栏一致 |

## 确定性规则

- 恢复：`nav_love`/`nav_songlist`/`nav_search` 原样恢复；`nav_top` → `nav_songlist`；`nav_download`/`nav_setting`/缺失/未知 → `nav_love`。
- 覆盖页（排行榜、下载、设置）不写 `lastNavActiveId`、不写 `viewPrevState`；排行榜入口先把父级固定为浏览。
- 覆盖页打开时底层分页手势关闭，原生页面事件与 `common.homePageScroll` 配置变化都不会顶掉当前覆盖页。

## 已执行验证

| 命令 | 结果 |
|---|---|
| `node --test tests/ui-interactions.test.cjs` | 通过，38/38（含本轮新增 5 条导航与文案回归） |
| `node --test tests/player-queue.test.cjs` | 通过，11/11（回归） |
| `node_modules/.bin/eslint <本轮改动文件>` | 无错误 |
| `node_modules/.bin/tsc --noEmit -p tsconfig.json` | 仅剩 2 条既有基线错误，均在未改动的 `src/core/player/player.ts`（651、660 行） |
| `react-native bundle --platform android --dev true`（输出到系统临时目录） | 打包成功，改动模块均可解析 |

## 未验证项与阻塞

- 无设备/模拟器（`adb devices` 为空），未做真机或模拟器的点击、滑动、旋转、系统返回、大字号与三种导航栏实测；改前/改后截图与录屏均缺失。
- 上述导航行为只在代码与单元层面验证，未完成 Phase 1 的界面验收（三页可点可滑、旋转后仍在同一内容、排行榜/设置/下载逐层返回）。
- 动画与动效未涉及，本轮未新增动效。

## 已知基线问题（不在本轮范围）

- 迷你播放器在无当前曲时仍会占位（3.4 的 `hasCurrentTrack` 规则属 Phase 2）。
- 资料库为空时只能导入、不能新建（卡片菜单是唯一新建入口，属 Phase 4A）。
- 排行榜列表滚动位置在关闭覆盖页后不保留（榜单选择与已加载数据仍保留在设置与模块状态中）。
