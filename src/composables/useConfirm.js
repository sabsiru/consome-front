import { ref } from 'vue'

const visible = ref(false)
const message = ref('')
const resolvePromise = ref(null)

export function useConfirm() {
  const confirm = (msg) => {
    message.value = msg
    visible.value = true
    return new Promise((resolve) => {
      resolvePromise.value = resolve
    })
  }

  const handleConfirm = () => {
    visible.value = false
    resolvePromise.value?.(true)
  }

  const handleCancel = () => {
    visible.value = false
    resolvePromise.value?.(false)
  }

  return {
    visible,
    message,
    confirm,
    handleConfirm,
    handleCancel,
  }
}
