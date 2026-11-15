import { useState } from 'react'
import Content from './Content'
import HomeDock from '../components/HomeDock'
import { useNavActiveId } from '@/store/common/hook'
import { BottomInsetContext } from '@/components/common/BottomInset'

export default () => {
  const [dockHeight, setDockHeight] = useState(0)
  const navActiveId = useNavActiveId()
  const showDock = navActiveId != 'nav_setting'

  // 四个核心页面共用 Dock，实测高度让列表末项保持可点击。
  return (
    <BottomInsetContext.Provider value={showDock ? dockHeight : 0}>
      <Content />
      {showDock
        ? <HomeDock onLayout={({ nativeEvent }) => { setDockHeight(nativeEvent.layout.height) }} />
        : null}
    </BottomInsetContext.Provider>
  )
}
