import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import messageExpiryMiddleware from './messageExpiryMiddleware'
import messagesReducer, {
  addMessage,
  clearMessages,
  removeMessage,
} from './messagesSlice'

const createStore = () =>
  configureStore({
    reducer: {
      utilities: combineReducers({ messages: messagesReducer }),
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(messageExpiryMiddleware),
  })

describe('message expiry', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('removes a timed socket message without a mounted snackbar', () => {
    const store = createStore()
    store.dispatch(
      addMessage({
        data: { message: 'Timed', snackbarShow: true, duration: 2 },
      })
    )

    expect(Object.values(store.getState().utilities.messages)).toHaveLength(1)
    vi.advanceTimersByTime(1999)
    expect(Object.values(store.getState().utilities.messages)).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(store.getState().utilities.messages).toEqual({})
  })

  it('does not remove a new message when an old key is reused', () => {
    const store = createStore()
    store.dispatch(
      addMessage({ data: { message: 'Old', snackbarShow: true, duration: 1 } })
    )
    store.dispatch(removeMessage({ messageKey: '1' }))
    store.dispatch(
      addMessage({ data: { message: 'New', snackbarShow: true, duration: 2 } })
    )

    vi.advanceTimersByTime(1000)
    expect(store.getState().utilities.messages['1'].message).toBe('New')
    vi.advanceTimersByTime(1000)
    expect(store.getState().utilities.messages).toEqual({})
  })

  it('cancels expiry when messages are cleared', () => {
    const store = createStore()
    store.dispatch(
      addMessage({ data: { message: 'Old', snackbarShow: true, duration: 1 } })
    )
    store.dispatch(clearMessages())
    store.dispatch(addMessage({ data: { message: 'New', snackbarShow: true } }))

    vi.advanceTimersByTime(1000)
    expect(store.getState().utilities.messages['1'].message).toBe('New')
  })
})
