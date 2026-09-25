import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'

import type { Message } from '@/lang'

import Basic from './settings/Basic'
import Source from './settings/Source'
import Player from './settings/Player'
import LyricDesktop from './settings/LyricDesktop'
import Search from './settings/Search'
import List from './settings/List'
import Sync from './settings/Sync'
import Backup from './settings/Backup'
import Other from './settings/Other'
import Version from './settings/Version'
import About from './settings/About'

export const SETTING_SCREENS = [
  'source',
  'basic',
  'player',
  'lyric_desktop',
  'search',
  'list',
  'sync',
  'backup',
  'other',
  'version',
  'about',
] as const

export type SettingScreenIds = typeof SETTING_SCREENS[number]

export const SETTING_NAV_GROUPS = [
  {
    titleKey: 'setting_nav_group_general',
    items: ['basic', 'source'],
  },
  {
    titleKey: 'setting_nav_group_playback',
    items: ['player', 'lyric_desktop'],
  },
  {
    titleKey: 'setting_nav_group_browse',
    items: ['search', 'list'],
  },
  {
    titleKey: 'setting_nav_group_data',
    items: ['sync', 'backup'],
  },
  {
    titleKey: 'setting_nav_group_more',
    items: ['other', 'version', 'about'],
  },
] as const

/** 目录行副标题，让人在进入页面前就知道里面能做什么。 */
export const SETTING_NAV_DESC: Record<SettingScreenIds, keyof Message> = {
  basic: 'setting_nav_desc_basic',
  source: 'setting_source_desc',
  player: 'setting_nav_desc_player',
  lyric_desktop: 'setting_nav_desc_lyric_desktop',
  search: 'setting_nav_desc_search',
  list: 'setting_nav_desc_list',
  sync: 'setting_nav_desc_sync',
  backup: 'setting_nav_desc_backup',
  other: 'setting_nav_desc_other',
  version: 'setting_nav_desc_version',
  about: 'setting_nav_desc_about',
}

export const SETTING_NAV_ICONS: Record<SettingScreenIds, string> = {
  basic: 'setting',
  source: 'album',
  player: 'play-outline',
  lyric_desktop: 'lyric-on',
  search: 'search-2',
  list: 'add_folder',
  sync: 'share',
  backup: 'sd-card',
  other: 'help',
  version: 'available_updates',
  about: 'logo',
}

export const SettingScreen = ({ id }: { id: SettingScreenIds }) => {
  switch (id) {
    case 'source': return <Source />
    case 'player': return <Player />
    case 'lyric_desktop': return <LyricDesktop />
    case 'search': return <Search />
    case 'list': return <List />
    case 'sync': return <Sync />
    case 'backup': return <Backup />
    case 'other': return <Other />
    case 'version': return <Version />
    case 'about': return <About />
    case 'basic':
    default: return <Basic />
  }
}

// interface MainProps {
//   onUpdateActiveId: (id: string) => void
// }
export interface MainType {
  setActiveId: (id: SettingScreenIds) => void
}

const Main = forwardRef<MainType, {}>((props, ref) => {
  const [id, setId] = useState(global.lx.settingActiveId)

  useImperativeHandle(ref, () => ({
    setActiveId(id) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setId(id)
        })
      })
    },
  }))

  const component = useMemo(() => <SettingScreen id={id} />, [id])

  return component
})


export default Main
