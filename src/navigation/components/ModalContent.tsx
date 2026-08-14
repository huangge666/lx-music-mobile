import { View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { BorderRadius } from '@/theme'

/**
 * Apple Music 风格 Modal 内容容器
 *
 * — 圆角 14pt（Apple modal 标准圆角）
 * — 内容背景使用 c-content-background
 * — 顶部 header 条使用 c-card-background 次级背景
 */
const HEADER_HEIGHT = 20

interface Props {
  children: React.ReactNode
}


export default ({ children }: Props) => {
  const theme = useTheme()

  return (
    <View style={{ ...styles.centeredView, backgroundColor: 'rgba(50,50,50,.3)' }}>
      <View style={{ ...styles.modalView, backgroundColor: theme['c-content-background'] }}>
        <View style={{ ...styles.header, backgroundColor: theme['c-card-background'] }}></View>
        {children}
      </View>
    </View>
  )
}


const styles = createStyle({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    maxWidth: '90%',
    minWidth: '60%',
    maxHeight: '78%',
    borderRadius: BorderRadius.normal,
    elevation: 3,
  },
  header: {
    flexGrow: 0,
    flexShrink: 0,
    flexDirection: 'row',
    borderTopLeftRadius: BorderRadius.normal,
    borderTopRightRadius: BorderRadius.normal,
    height: HEADER_HEIGHT,
  },
})
