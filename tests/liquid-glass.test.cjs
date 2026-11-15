const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadSource } = require('./load-source.cjs')

const makeDrag = () => {
  const moves = []
  const ends = []
  const { useSheetDrag } = loadSource('src/utils/hooks/useSheetDrag.ts', {
    react: { useRef: current => ({ current }) },
  })
  const invokeDrag = useSheetDrag
  const handlers = invokeDrag(distance => moves.push(distance), dismiss => ends.push(dismiss))
  const event = (x, y, timestamp) => ({ nativeEvent: { pageX: x, pageY: y, timestamp } })
  return { handlers, moves, ends, event }
}

test('sheet header taps and horizontal swipes do not dismiss', () => {
  const { handlers, moves, ends, event } = makeDrag()
  handlers.onTouchStart(event(100, 100, 0))
  handlers.onTouchEnd(event(100, 100, 100))
  handlers.onTouchStart(event(100, 100, 200))
  handlers.onTouchMove(event(200, 120, 300))
  handlers.onTouchEnd(event(200, 120, 350))
  assert.deepEqual(moves, [])
  assert.deepEqual(ends, [])
})

test('short drags snap back, long drags dismiss, cancellation snaps back', () => {
  const { handlers, moves, ends, event } = makeDrag()
  handlers.onTouchStart(event(100, 100, 0))
  handlers.onTouchMove(event(100, 140, 500))
  handlers.onTouchEnd(event(100, 140, 600))
  handlers.onTouchStart(event(100, 100, 700))
  handlers.onTouchMove(event(100, 240, 1200))
  handlers.onTouchEnd(event(100, 240, 1300))
  handlers.onTouchStart(event(100, 100, 1400))
  handlers.onTouchMove(event(100, 150, 1800))
  handlers.onTouchCancel()
  assert.deepEqual(moves, [40, 140, 50])
  assert.deepEqual(ends, [false, true, false])
})

test('only a recent fast downward swipe dismisses below the distance threshold', () => {
  const { handlers, ends, event } = makeDrag()
  handlers.onTouchStart(event(100, 100, 0))
  handlers.onTouchMove(event(100, 150, 20))
  handlers.onTouchEnd(event(100, 150, 25))
  handlers.onTouchStart(event(100, 100, 100))
  handlers.onTouchMove(event(100, 150, 120))
  handlers.onTouchEnd(event(100, 150, 350))
  assert.deepEqual(ends, [true, false])
})

test('mini player reserves two scaled text lines and independent 48dp controls', () => {
  let fontScale = 1
  let appScale = 1
  const { getMiniPlayerHeight } = loadSource('src/components/player/PlayerBar/layout.ts', {
    'react-native': { PixelRatio: { getFontScale: () => fontScale } },
    '@/utils/pixelRatio': { setSpText: size => size * appScale },
  })
  assert.equal(getMiniPlayerHeight(), 56)
  assert.equal(getMiniPlayerHeight(true), 62)
  appScale = 1.5
  fontScale = 1.5
  assert(getMiniPlayerHeight() >= Math.ceil(26 * 1.2 * appScale * fontScale) + 16)
})
