import type { Message } from '@/lang'

import Basic from './settings/Basic'
import Source from './settings/Source'
import Player from './settings/Player'
import Search from './settings/Search'
import List from './settings/List'
import Download from './settings/Download'

export const SETTING_SCREENS = [
  'source',
  'basic',
  'player',
  'search',
  'list',
  'download',
] as const

export type SettingScreenIds = typeof SETTING_SCREENS[number]

export const SETTING_NAV_GROUPS = [
  {
    titleKey: 'setting_nav_group_general',
    items: ['basic', 'source'],
  },
  {
    titleKey: 'setting_nav_group_playback',
    items: ['player', 'download'],
  },
  {
    titleKey: 'setting_nav_group_browse',
    items: ['search', 'list'],
  },
] as const

/** 目录行副标题，让人在进入页面前就知道里面能做什么。 */
export const SETTING_NAV_DESC: Record<SettingScreenIds, keyof Message> = {
  basic: 'setting_nav_desc_basic',
  source: 'setting_source_desc',
  player: 'setting_nav_desc_player',
  search: 'setting_nav_desc_search',
  list: 'setting_nav_desc_list',
  download: 'setting_nav_desc_download',
}

export const SETTING_NAV_ICONS: Record<SettingScreenIds, string> = {
  basic: 'setting',
  source: 'album',
  player: 'play-outline',
  search: 'search-2',
  list: 'add_folder',
  download: 'download-2',
}

export const SettingScreen = ({ id }: { id: SettingScreenIds }) => {
  switch (id) {
    case 'source': return <Source />
    case 'player': return <Player />
    case 'search': return <Search />
    case 'list': return <List />
    case 'download': return <Download />
    case 'basic':
    default: return <Basic />
  }
}
