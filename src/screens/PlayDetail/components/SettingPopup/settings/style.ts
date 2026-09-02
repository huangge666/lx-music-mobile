import { createStyle } from '@/utils/tools'

export default createStyle({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'stretch',
  },
  titleText: {
    fontWeight: '600',
    marginBottom: 8,
  },
  label: {
    minWidth: 42,
    textAlign: 'center',
    fontWeight: '600',
    marginRight: 6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
})
