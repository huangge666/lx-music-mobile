export const HEADER_HEIGHT = 42
export const LIST_ITEM_HEIGHT = 54
export const LIST_SCROLL_POSITION_KEY = '__LIST_SCROLL_POSITION_KEY__'

export const SPLIT_CHAR = {
  DISLIKE_NAME: '@',
  DISLIKE_NAME_ALIAS: '#',
} as const

export const LIST_IDS = {
  DEFAULT: 'default',
  LOVE: 'love',
  TEMP: 'temp',
  DOWNLOAD: 'download',
  PLAY_LATER: null,
} as const

// export const COMPONENT_IDS = {
//   home: 'home',
//   playDetail: 'playDetail',
// } as const
// export type COMPONENT_IDS_TYPE = keyof typeof COMPONENT_IDS
export enum COMPONENT_IDS {
  home = 'home',
  playDetail = 'playDetail',
  songlistDetail = 'songlistDetail',
  mylistDetail = 'mylistDetail',
  comment = 'comment',
  sourceManager = 'sourceManager',
  setting = 'setting',
}

export enum NAV_SHEAR_NATIVE_IDS {
  playDetail_pic = 'playDetail_pic',
  playDetail_header = 'playDetail_header',
  // playDetail_pageIndicator = 'playDetail_pageIndicator',
  playDetail_player = 'playDetail_player',
  songlistDetail_pic = 'songlistDetail_pic',
  songlistDetail_title = 'songlistDetail_title',
}


export const storageDataPrefix = {
  setting: '@setting_v1',
  userList: '@user_list',
  viewPrevState: '@view_prev_state',

  list: '@list__',
  listMusicCount: '@list_music_count',
  listScrollPosition: '@list_scroll_position',
  listPrevSelectId: '@list_prev_select_id',

  lyric: '@lyric__',
  musicUrl: '@music_url__',
  musicOtherSource: '@music_other_source__',
  playInfo: '@play_info',

  syncAuthKey: '@sync_auth_key',
  syncHost: '@sync_host',
  syncHostHistory: '@sync_host_history',

  openStoragePath: '@open_storage_path',
  selectedManagedFolder: '@selected_managed_folder',
  notificationTipEnable: '@notification_tip_enable',
  ignoringBatteryOptimizationTipEnable: '@ignoring_battery_optimization_tip_enable',

  searchHistoryList: '@search_history_list',
  listUpdateInfo: '@list_update_info',
  ignoreVersion: '@ignore_version',
  ignoreVersionFailTipTimeKey: '@ignore_version_fail_tip_time',
  leaderboardSetting: '@leaderboard_setting',
  songListSetting: '@songist_setting',
  searchSetting: '@search_setting',

  fontSize: '@font_size',

  theme: '@theme',

  cheatTip: '@cheat_tip',
  remoteLyricTip: '@remote_lyric_tip',

  dislikeList: '@dislike_list',

  userApi: '@user_api__',
} as const

// v0.x.x 版本的 data keys
export const storageDataPrefixOld = {
  setting: '@setting',
  list: '@list__',
  listPosition: '@listposition__',
  listSort: '@listsort__',
  // lyric: '@lyric__',
  // musicUrl: '@music_url__',
  playInfo: '@play_info',
  syncAuthKey: '@sync_auth_key',
  syncHost: '@sync_host',
  syncHostHistory: '@sync_host_history',
  notificationTipEnable: '@notification_tip_enable',
} as const

export const APP_PROVIDER_NAME = 'cn.toside.music.mobile.provider'


export const NAV_MENUS = [
  { id: 'nav_search', icon: 'search-2' },
  { id: 'nav_songlist', icon: 'album' },
  { id: 'nav_top', icon: 'leaderboard' },
  { id: 'nav_love', icon: 'love' },
  { id: 'nav_download', icon: 'download-2' },
  { id: 'nav_setting', icon: 'setting' },
] as const

export type NAV_ID_Type = typeof NAV_MENUS[number]['id']

export type NAV_MENU_Type = typeof NAV_MENUS[number]

/**
 * 首页三个主标签的唯一顺序（资料库 / 浏览 / 搜索）。
 * 底部标签栏、首页分页器与主标签判断共用这一份定义；
 * 排行榜、下载、设置是覆盖页，仍保留在 NAV_MENUS 的完整 id 集合里。
 * icon 必须与 NAV_MENUS 中同 id 的图标一致（有回归测试覆盖）。
 */
export const MAIN_NAV_MENUS = [
  { id: 'nav_love', icon: 'love' },
  { id: 'nav_songlist', icon: 'album' },
  { id: 'nav_search', icon: 'search-2' },
] as const
export type MAIN_NAV_ID_Type = typeof MAIN_NAV_MENUS[number]['id']

export const MAIN_NAV_IDS: readonly MAIN_NAV_ID_Type[] = MAIN_NAV_MENUS.map(menu => menu.id)

/** 新安装、缺失值与未知值统一回到的默认主标签 */
export const DEFAULT_MAIN_NAV_ID: MAIN_NAV_ID_Type = 'nav_love'

/** 首页辅助抽屉承载的覆盖页入口，主标签不在这里重复出现 */
export const DRAWER_NAV_MENUS: readonly NAV_MENU_Type[] = (['nav_download', 'nav_setting'] as const)
  .map(id => NAV_MENUS.find(menu => menu.id == id)!)

export const isMainNavId = (id: string | null | undefined): id is MAIN_NAV_ID_Type =>
  typeof id == 'string' && (MAIN_NAV_IDS as readonly string[]).includes(id)

/** 主标签在首页分页器中的下标，顺序与 MAIN_NAV_IDS 完全一致 */
export const getMainNavIndex = (id: MAIN_NAV_ID_Type): number => MAIN_NAV_IDS.indexOf(id)
/** 分页位置对应的主标签 id，越界返回 undefined */
export const getMainNavIdAt = (index: number): MAIN_NAV_ID_Type | undefined => MAIN_NAV_IDS[index]

/**
 * 冷启动恢复时归一化历史导航值：
 * - 三个主标签原样恢复
 * - 旧版本的排行榜是主页面，恢复到它的父级「浏览」，不直接打开排行榜
 * - 下载/设置等覆盖页、缺失或未知值统一回到资料库
 */
export const normalizeNavId = (id: string | null | undefined): MAIN_NAV_ID_Type => {
  if (isMainNavId(id)) return id
  return id == 'nav_top' ? 'nav_songlist' : DEFAULT_MAIN_NAV_ID
}

export const LXM_FILE_EXT_RXP = ['json', 'lxmc', 'bin']
export const USER_API_SOURCE_FILE_EXT_RXP = ['js']

export const MUSIC_TOGGLE_MODE = {
  listLoop: 'listLoop', // 列表循环
  random: 'random', // 列表随机
  list: 'list', // 顺序播放
  singleLoop: 'singleLoop', // 单曲循环
  none: 'none', // 禁用
} as const

export const MUSIC_TOGGLE_MODE_LIST = [
  MUSIC_TOGGLE_MODE.listLoop,
  MUSIC_TOGGLE_MODE.random,
  MUSIC_TOGGLE_MODE.list,
  MUSIC_TOGGLE_MODE.singleLoop,
  MUSIC_TOGGLE_MODE.none,
] as const

export const DEFAULT_SETTING = {
  leaderboard: {
    source: 'kw' as LX.OnlineSource,
    boardId: 'kw__16',
  },

  songList: {
    source: 'kw' as LX.OnlineSource,
    sortId: 'new',
    tagName: '',
    tagId: '',
  },

  search: {
    temp_source: 'kw' as LX.OnlineSource,
    source: 'all' as LX.OnlineSource | 'all',
    type: 'music' as 'music' | 'songlist',
  },

  viewPrevState: {
    id: DEFAULT_MAIN_NAV_ID as NAV_ID_Type,
    // query: {},
  },
}
