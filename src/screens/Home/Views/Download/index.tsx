import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { FlatList, TouchableOpacity, View } from 'react-native'
import Text from '@/components/common/Text'
import { createStyle, toast } from '@/utils/tools'
import { readMusicDownloadDirectory, removeMusicDownloadTarget, type FileType, type MusicDownloadDirItem } from '@/utils/fs'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import { useNavActiveId } from '@/store/common/hook'
import { BorderWidths, BorderRadius } from '@/theme'
import { sizeFormate } from '@/utils'
import { getDownloadTasks, removeDownloadTask, type DownloadTaskItem } from '@/core/music/downloader'
import { handleFileMusicAction } from '@/core/init/deeplink/fileAction'
import { useI18n } from '@/lang'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import CheckBox from '@/components/common/CheckBox'

interface DownloadListItem {
  key: string
  taskId: string | null
  name: string
  path: string
  status: DownloadTaskItem['status']
  statusText: string
  progress: number
  downloaded: number
  total: number
  quality: string
  size: number | null
}

const ProgressBar = memo(({ progress }: { progress: number }) => {
  const theme = useTheme()
  return (
    <View style={[styles.progressTrack, { backgroundColor: theme['c-border-background'] }]}>
      <View style={[styles.progressBar, { width: `${Math.max(0, Math.min(progress, 1)) * 100}%`, backgroundColor: theme['c-primary'] }]} />
    </View>
  )
})

const IconAction = memo(({
  name,
  onPress,
  danger = false,
  accessibilityLabel,
}: {
  name: string
  onPress: () => void
  danger?: boolean
  accessibilityLabel: string
}) => {
  const theme = useTheme()
  return (
    <TouchableOpacity
      style={[styles.iconBtn, { backgroundColor: danger ? theme['c-primary-background-hover'] : theme['c-button-background'] }]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Icon name={name} size={14} color={danger ? theme['c-font'] : theme['c-button-font']} />
    </TouchableOpacity>
  )
})

const DownloadRow = memo(({
  item,
  onPlay,
  onRemove,
}: {
  item: DownloadListItem
  onPlay: (item: DownloadListItem) => Promise<void>
  onRemove: (item: DownloadListItem) => void
}) => {
  const theme = useTheme()
  const t = useI18n()
  const sizeText = useMemo(() => {
    if (item.total > 0) return `${sizeFormate(item.downloaded || 0)} / ${sizeFormate(item.total)}`
    if (item.size != null) return sizeFormate(item.size || 0)
    return ''
  }, [item.downloaded, item.size, item.total])
  const isRunning = item.status === 'run' || item.status === 'waiting'
  const isCompleted = item.status === 'completed'
  const subtitle = [item.quality, item.statusText || item.status, sizeText].filter(Boolean).join(' · ')

  return (
    <View style={[
      styles.row,
      {
        borderColor: theme['c-border-background'],
        backgroundColor: isCompleted ? theme['c-primary-alpha-800'] : 'rgba(0,0,0,0.03)',
      },
    ]}>
      <Icon name="album" size={16} color={isCompleted ? theme['c-primary-font-active'] : theme['c-primary-font']} />
      <View style={styles.rowCenter}>
        <Text numberOfLines={1}>{item.name}</Text>
        <Text size={11} color={theme['c-font-label']} numberOfLines={1}>{subtitle}</Text>
        {isRunning ? <ProgressBar progress={item.progress || 0} /> : null}
      </View>
      <View style={styles.rowActions}>
        {isCompleted ? <IconAction name="play-outline" accessibilityLabel={t('play')} onPress={() => { void onPlay(item) }} /> : null}
        {item.path
          ? <IconAction
              name="remove"
              danger
              accessibilityLabel={t('delete')}
              onPress={() => { onRemove(item) }}
            />
          : null}
      </View>
    </View>
  )
})

interface RemoveConfirmType {
  show: (item: DownloadListItem) => void
}
interface RemoveConfirmProps {
  onConfirm: (item: DownloadListItem, removeFile: boolean) => void
}

const RemoveConfirm = forwardRef<RemoveConfirmType, RemoveConfirmProps>(({ onConfirm }, ref) => {
  const t = useI18n()
  const alertRef = useRef<ConfirmAlertType>(null)
  const itemRef = useRef<DownloadListItem | null>(null)
  const [visible, setVisible] = useState(false)
  const [item, setItem] = useState<DownloadListItem | null>(null)
  const [removeFile, setRemoveFile] = useState(false)

  const handleShow = () => {
    alertRef.current?.setVisible(true)
  }

  useImperativeHandle(ref, () => ({
    show(next) {
      itemRef.current = next
      setItem(next)
      setRemoveFile(false)
      if (visible) handleShow()
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow()
        })
      }
    },
  }), [visible])

  const handleConfirm = () => {
    const current = itemRef.current
    if (!current) return
    alertRef.current?.setVisible(false)
    onConfirm(current, removeFile)
  }

  return (
    visible
      ? (
        <ConfirmAlert
          ref={alertRef}
          title={t('download_remove_title')}
          onConfirm={handleConfirm}
        >
          <View style={styles.removeContent}>
            <Text style={styles.removeMessage}>{t('download_remove_message', { name: item?.name ?? '' })}</Text>
            <CheckBox
              check={removeFile}
              label={t('download_remove_file_option')}
              onChange={setRemoveFile}
            />
          </View>
        </ConfirmAlert>
        )
      : null
  )
})

export default () => {
  const t = useI18n()
  const theme = useTheme()
  const navActiveId = useNavActiveId()
  const removeConfirmRef = useRef<RemoveConfirmType>(null)
  const [isLoading, setLoading] = useState(false)
  const [files, setFiles] = useState<MusicDownloadDirItem[]>([])
  const [tasks, setTasks] = useState<DownloadTaskItem[]>([])

  const refresh = useCallback(async(showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const taskList = getDownloadTasks()
      const fileList = await readMusicDownloadDirectory()
      setTasks(taskList)
      setFiles(fileList.filter(item => item.isFile))
    } catch {
      setTasks(getDownloadTasks())
      setFiles([])
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (navActiveId == 'nav_download') {
      refresh(true).catch(() => {})
    }
  }, [navActiveId, refresh])

  useEffect(() => {
    const handleDownloadListUpdate = () => {
      if (navActiveId == 'nav_download') {
        refresh(false).catch(() => {})
      }
    }
    global.app_event.on('downloadListUpdate', handleDownloadListUpdate)
    return () => {
      global.app_event.off('downloadListUpdate', handleDownloadListUpdate)
    }
  }, [navActiveId, refresh])

  // 进行中的任务优先展示；目录里已有、但不在任务表里的文件补到后面
  const mergedList = useMemo(() => {
    const taskItems: DownloadListItem[] = tasks.map(task => ({
      key: `task:${task.id}`,
      taskId: task.id,
      name: task.musicInfo.name,
      path: task.filePath,
      status: task.status,
      statusText: task.errorMessage || task.statusText,
      progress: task.progress,
      downloaded: task.downloaded,
      total: task.total,
      quality: task.quality,
      size: task.total || null,
    }))
    const taskPaths = new Set(taskItems.map(item => item.path).filter(Boolean))
    const fileItems: DownloadListItem[] = files
      .filter(item => !taskPaths.has(item.path))
      .map(item => ({
        key: `file:${item.path}`,
        taskId: null,
        name: item.name,
        path: item.path,
        status: 'completed',
        statusText: t('download_status_completed'),
        progress: 1,
        downloaded: item.size,
        total: item.size,
        quality: '',
        size: item.size,
      }))
    return [...taskItems, ...fileItems]
  }, [files, t, tasks])

  const handleRefreshPress = () => {
    refresh(false)
      .then(() => {
        toast(t('download_refreshed'))
      })
      .catch(() => {})
  }

  const handlePlay = async(item: DownloadListItem) => {
    if (!item.path) return
    const file: FileType = {
      name: item.name,
      path: item.path,
      isDirectory: false,
      isFile: true,
      lastModified: 0,
      canRead: true,
      data: '',
      mimeType: '',
      size: item.size ?? 0,
    }
    await handleFileMusicAction(file)
  }

  const handleRemove = (item: DownloadListItem) => {
    removeConfirmRef.current?.show(item)
  }

  const handleRemoveConfirm = (item: DownloadListItem, removeFile: boolean) => {
    void (async() => {
      if (item.taskId) {
        await removeDownloadTask(item.taskId, removeFile)
      } else if (removeFile && item.path) {
        await removeMusicDownloadTarget(item.path)
        global.app_event.downloadListUpdate()
      }
      await refresh(false)
    })()
  }

  return (
    <View style={styles.container}>
      <View style={[
        styles.header,
        { borderBottomColor: theme['c-border-background'] },
      ]}>
        <Text style={styles.title} size={17}>{t('nav_download')}</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefreshPress} activeOpacity={0.75}>
          <Text size={12}>{t('download_refresh')}</Text>
        </TouchableOpacity>
      </View>
      {
        isLoading
          ? <Text style={styles.tip} color={theme['c-font-label']}>{t('download_loading')}</Text>
          : mergedList.length
            ? (
              <FlatList
                data={mergedList}
                contentContainerStyle={styles.list}
                keyExtractor={item => item.key}
                renderItem={({ item }) => (
                  <DownloadRow
                    item={item}
                    onPlay={handlePlay}
                    onRemove={handleRemove}
                  />
                )}
              />
              )
            : <Text style={styles.tip} color={theme['c-font-label']}>{t('download_empty')}</Text>
      }
      <RemoveConfirm ref={removeConfirmRef} onConfirm={handleRemoveConfirm} />
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: BorderWidths.normal,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 14,
  },
  title: {
    fontWeight: '700',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  list: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  row: {
    borderWidth: BorderWidths.normal,
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowCenter: {
    flex: 1,
    paddingLeft: 8,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  progressTrack: {
    height: 4,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: BorderRadius.medium,
  },
  tip: {
    textAlign: 'center',
    paddingVertical: 24,
  },
  removeContent: {
    flexGrow: 1,
    flexShrink: 1,
  },
  removeMessage: {
    paddingBottom: 16,
  },
})
