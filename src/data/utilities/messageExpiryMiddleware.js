import { addMessage, clearMessages, removeMessage } from './messagesSlice'

const messageExpiryMiddleware = (store) => {
  const timers = new Map()

  return (next) => (action) => {
    if (removeMessage.match(action)) {
      const messageKey = String(action.payload?.messageKey)
      clearTimeout(timers.get(messageKey))
      timers.delete(messageKey)
    } else if (clearMessages.match(action)) {
      timers.forEach(clearTimeout)
      timers.clear()
    }

    const result = next(action)

    if (addMessage.match(action) && action.payload?.data?.snackbarShow) {
      const { duration } = action.payload.data
      if (duration != null) {
        const keys = Object.keys(store.getState().utilities.messages)
        const messageKey = keys[keys.length - 1]
        timers.set(
          messageKey,
          setTimeout(() => {
            timers.delete(messageKey)
            store.dispatch(removeMessage({ messageKey }))
          }, duration * 1000)
        )
      }
    }

    return result
  }
}

export default messageExpiryMiddleware
