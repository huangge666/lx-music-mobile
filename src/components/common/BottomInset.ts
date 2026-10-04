import { createContext, useContext } from 'react'

/** 两种底栏都锚定页面底边，叠加遮挡取最大值，而不是把高度相加。 */
export const BottomInsetContext = createContext(0)
export const OverlayInsetContext = createContext(0)

export const useBottomInset = () => {
  const dock = useContext(BottomInsetContext)
  const overlay = useContext(OverlayInsetContext)
  return Math.max(dock, overlay)
}
