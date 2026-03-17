import { ref, onMounted, onUnmounted, nextTick } from 'vue'

/**
 * 엘리먼트를 드래그 가능하게 만드는 composable
 * @param {string} storageKey - localStorage 위치 저장 키
 * @param {object} defaultPos - 기본 위치 { top, right }
 * @returns {{ elRef, posStyle, wasDragged }}
 */
export function useDraggable(storageKey, defaultPos = { top: 80, right: 20 }) {
  const elRef = ref(null)
  const wasDragged = ref(false)
  const posStyle = ref(null) // null이면 CSS 기본 위치 사용

  let isDragging = false
  let startX = 0
  let startY = 0
  let startLeft = 0
  let startTop = 0
  let moved = false
  const DRAG_THRESHOLD = 5
  const EL_SIZE = 52 // padding(10*2) + orb(32)

  const loadPosition = () => {
    try {
      const saved = sessionStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved)
    } catch {}
    return null
  }

  const savePosition = (left, top) => {
    sessionStorage.setItem(storageKey, JSON.stringify({ left, top }))
  }

  const clamp = (left, top) => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    return {
      left: Math.max(0, Math.min(left, vw - EL_SIZE)),
      top: Math.max(0, Math.min(top, vh - EL_SIZE)),
    }
  }

  const setPos = (left, top) => {
    const clamped = clamp(left, top)
    posStyle.value = {
      left: `${clamped.left}px`,
      top: `${clamped.top}px`,
      right: 'auto',
    }
    return clamped
  }

  const onPointerDown = (e) => {
    if (e.button && e.button !== 0) return
    isDragging = true
    moved = false
    wasDragged.value = false

    const touch = e.touches ? e.touches[0] : e
    startX = touch.clientX
    startY = touch.clientY

    const rect = elRef.value.getBoundingClientRect()
    startLeft = rect.left
    startTop = rect.top

    document.addEventListener('mousemove', onPointerMove)
    document.addEventListener('mouseup', onPointerUp)
    document.addEventListener('touchmove', onPointerMove, { passive: false })
    document.addEventListener('touchend', onPointerUp)
  }

  const onPointerMove = (e) => {
    if (!isDragging) return
    const touch = e.touches ? e.touches[0] : e
    const dx = touch.clientX - startX
    const dy = touch.clientY - startY

    if (!moved && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return
    moved = true
    e.preventDefault()

    setPos(startLeft + dx, startTop + dy)
  }

  const onPointerUp = () => {
    if (!isDragging) return
    isDragging = false

    document.removeEventListener('mousemove', onPointerMove)
    document.removeEventListener('mouseup', onPointerUp)
    document.removeEventListener('touchmove', onPointerMove)
    document.removeEventListener('touchend', onPointerUp)

    if (moved) {
      wasDragged.value = true
      const rect = elRef.value.getBoundingClientRect()
      const clamped = setPos(rect.left, rect.top)
      savePosition(clamped.left, clamped.top)
    }
  }

  onMounted(async () => {
    await nextTick()
    const el = elRef.value
    if (!el) return

    // 저장된 위치가 있으면 적용
    const saved = loadPosition()
    if (saved) {
      setPos(saved.left, saved.top)
    }
    // 없으면 posStyle = null → CSS 기본 위치(top:80px, right:20px) 사용

    el.addEventListener('mousedown', onPointerDown)
    el.addEventListener('touchstart', onPointerDown, { passive: true })
  })

  onUnmounted(() => {
    const el = elRef.value
    if (el) {
      el.removeEventListener('mousedown', onPointerDown)
      el.removeEventListener('touchstart', onPointerDown)
    }
    document.removeEventListener('mousemove', onPointerMove)
    document.removeEventListener('mouseup', onPointerUp)
    document.removeEventListener('touchmove', onPointerMove)
    document.removeEventListener('touchend', onPointerUp)
  })

  return { elRef, posStyle, wasDragged }
}
