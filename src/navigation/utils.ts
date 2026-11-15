import { Navigation } from 'react-native-navigation'


export const getStatusBarStyle = (isDark: boolean) => isDark ? 'light' : 'dark'

export const dismissOverlay = async(compId: string) => Navigation.dismissOverlay(compId)

export const pop = async(compId: string) => Navigation.pop(compId)
export const popToRoot = async(compId: string) => Navigation.popToRoot(compId)
export const popTo = async(compId: string) => Navigation.popTo(compId)
