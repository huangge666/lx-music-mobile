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

## 启动闪退排查与修复（Android 构建产物问题，与 Phase 1 改动无关）

- 现象：安装 debug 包后启动即闪退，`adb logcat -b crash` 报
  `Unable to instantiate application cn.toside.music.mobile.MainApplication: java.lang.ClassNotFoundException`，
  并附带 `NoClassDefFoundError: com.reactnativenavigation.NavigationApplication`。
- 定位：`dex2oat` 给出 `Failure to verify dex file 'base.apk:classes10.dex': Bad checksum`；用 adler32 + SHA-1 校验 APK 内 10 个 dex，`classes2.dex` 与中间产物 `app/build/intermediates/dex/debug/mergeExtDexDebug/classes2.dex` 校验不一致（文件大小与 `file_size` 头字段一致，属于内容损坏而非截断）。坏文件时间是 2026-09-27，10-16 重新打包时被复用且任务被判为 up-to-date；Android 7.1.2 的 ART 不做校验跳过，因此整包类加载失败。
- 修复：删除 `android/app/build/intermediates/dex/debug/mergeExtDexDebug`（仅 dex 合并产物，保留其余增量缓存）→ 重跑 `:app:assembleDebug`；确认新合并 dex 校验通过后，删除 `android/app/build/outputs/apk/debug` 强制重新打包（`packageDebug` 曾判为 up-to-date）。修复后 5 个 ABI 的 APK 全部 `ALL DEX OK`。
- 同类问题自查：APK 启动即 `ClassNotFoundException` 时，先校验 dex 的 adler32/SHA-1 与中间产物是否一致，不要先怀疑 JS/业务代码。

## 已执行验证

| 检查 | 结果 |
|---|---|
| `node --test tests/ui-interactions.test.cjs` | 通过，38/38（含本轮新增 5 条导航与文案回归） |
| `node --test tests/player-queue.test.cjs` | 通过，11/11（回归） |
| `eslint` 定向检查全部改动文件 | 无错误 |
| `tsc --noEmit -p tsconfig.json` | 仅剩 2 条既有基线错误，均在未改动的 `src/core/player/player.ts`（651、660 行） |
| `react-native bundle --platform android --dev true` | 打包成功 |
| `:app:assembleDebug` + dex 校验 | 5 个 ABI 全部 `ALL DEX OK` |
| 设备实测：安装 x86_64 debug 包（720×1280，Android 7.1.2，240dpi，`adb` 38947 端口设备） | 冷启动无崩溃（`FATAL EXCEPTION`/`ClassNotFoundException` 计数 0，新进程正常起） |
| 设备实测：底栏三标签 | 资料库/浏览/搜索 可点击切换，`selected` 状态正确，页头与内容随标签切换 |
| 设备实测：资料库页头 | 显示「导入歌单」与「更多」；点「更多」打开辅助抽屉，内容只有 下载 / 设置 / 退出应用（回桌面项受 `common.showBackBtn` 关闭，符合设置） |
| 设备实测：浏览页头 | 显示「排行榜」入口 |
| 设备实测：排行榜覆盖页 | 页头标题「排行榜」+ 返回按钮，底部主标签栏隐藏，浏览页内容仍在底层 |
| 设备实测：系统返回 | 榜单抽屉打开时先收抽屉（排行榜保持打开），再次返回回到「浏览」且底栏恢复、浏览为选中态 |

## 未验证项与阻塞

- 未做旋转、最大应用字号/系统字体缩放、三键导航与手势导航的系统栏避让实测。
- 未验证设置子页（下载/设置入口逐层返回）在真机上的完整路径，只在代码层核对。
- 未做改前/改后截图对比；本轮只有零散截图（系统临时目录），未归档到仓库。
- 动画与动效未涉及，本轮未新增动效。
- 已知既有行为（本轮未改）：主标签页上打开辅助抽屉后按系统返回会直接退出应用到桌面，抽屉本身不消费返回键；下载/设置/排行榜页面才有返回处理。

## 已知基线问题（不在本轮范围）

- 迷你播放器在无当前曲时仍会占位（3.4 的 `hasCurrentTrack` 规则属 Phase 2）。
- 资料库为空时只能导入、不能新建（卡片菜单是唯一新建入口，属 Phase 4A）。
- 排行榜列表滚动位置在关闭覆盖页后不保留（榜单选择与已加载数据仍保留在设置与模块状态中）。
