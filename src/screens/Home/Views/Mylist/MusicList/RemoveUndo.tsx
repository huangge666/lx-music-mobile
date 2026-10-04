import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { ActivityIndicator, TouchableOpacity, View } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle, toast } from '@/utils/tools'
import { removeMusicWithUndo } from './removeMusicWithUndo'

interface PendingRemoval {
  name: string
  restore: () => Promise<void>
}
export interface RemoveUndoType {
  remove: (listId: string, musicInfo: LX.Music.MusicInfo) => void
}

export default forwardRef<RemoveUndoType, {}>((props, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const [pending, setPending] = useState<PendingRemoval | null>(null)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const operationRef = useRef(0)
  const mountedRef = useRef(true)

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }
  const expire = () => {
    clearTimer()
    timerRef.current = setTimeout(() => { setPending(null) }, 8000)
  }
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      // 这是操作序号而不是节点引用，卸载时取消最新操作的界面回调。
      // eslint-disable-next-line react-hooks/exhaustive-deps
      operationRef.current++
      clearTimer()
    }
  }, [])

  useImperativeHandle(ref, () => ({
    async remove(listId, musicInfo) {
      const operation = ++operationRef.current
      clearTimer()
      setPending(null)
      try {
        const restore = await removeMusicWithUndo(listId, musicInfo)
        if (!mountedRef.current || operation != operationRef.current) return
        setPending({ name: musicInfo.name, restore })
        expire()
      } catch (err) {
        console.error(err)
        if (mountedRef.current) toast(t('list_remove_failed'))
      }
    },
  }))

  const undo = async() => {
    if (!pending || busyRef.current) return
    const operation = operationRef.current
    clearTimer()
    busyRef.current = true
    setBusy(true)
    try {
      await pending.restore()
      if (mountedRef.current && operation == operationRef.current) setPending(null)
    } catch (err) {
      console.error(err)
      if (mountedRef.current && operation == operationRef.current) {
        toast(err instanceof Error ? err.message : t('list_undo_failed'), 'long')
        expire()
      }
    } finally {
      busyRef.current = false
      if (mountedRef.current) setBusy(false)
    }
  }

  if (!pending) return null
  return (
    <View style={[styles.container, { backgroundColor: theme['c-content-background'], borderColor: theme['c-glass-border'] }]}>
      <Text style={styles.message} size={13} numberOfLines={2} accessibilityLiveRegion="polite">{t('list_remove_undo_message', { name: pending.name })}</Text>
      <TouchableOpacity onPress={undo} style={styles.action} disabled={busy} accessibilityRole="button" accessibilityLabel={t('list_undo')} accessibilityState={{ disabled: busy, busy }} activeOpacity={0.6}>
        {busy ? <ActivityIndicator color={theme['c-accent']} /> : <Icon name="retry" color={theme['c-accent']} size={17} />}
        <Text color={theme['c-accent']} style={styles.label}>{t('list_undo')}</Text>
      </TouchableOpacity>
    </View>
  )
})

const styles = createStyle({
  container: { position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 12, minHeight: 56, borderRadius: 18, borderWidth: 0.5, paddingLeft: 16, paddingRight: 4, flexDirection: 'row', alignItems: 'center', elevation: 8 },
  message: { flex: 1, paddingVertical: 12 },
  action: { minHeight: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  label: { marginLeft: 8, fontWeight: '600' },
})
