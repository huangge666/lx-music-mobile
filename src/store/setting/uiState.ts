import type { SettingScreenIds } from '@/screens/Home/Views/Setting'

let activeScreenId: SettingScreenIds | null = null

export const getSettingActiveScreenId = () => activeScreenId

export const setSettingActiveScreenId = (id: SettingScreenIds | null) => {
  if (activeScreenId == id) return
  activeScreenId = id
  global.app_event.settingScreenChanged(id)
}
