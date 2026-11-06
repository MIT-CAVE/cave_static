import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import postToParent from './PostToParent'
import { socket } from './websockets'

describe('postToParent', () => {
  const originalWindow = global.window

  afterEach(() => {
    global.window = originalWindow
    vi.restoreAllMocks()
  })

  it('does nothing when window is undefined', () => {
    delete global.window
    expect(() => {
      postToParent({ event: 'ws_status', status: 'connected' })
    }).not.toThrow()
  })

  it('does nothing in standalone / Storybook mode when window.parent === window', () => {
    const postMessageMock = vi.fn()
    const mockWindow = {
      postMessage: postMessageMock,
    }
    mockWindow.parent = mockWindow
    global.window = mockWindow

    postToParent({ event: 'ws_status', status: 'connected' })
    expect(postMessageMock).not.toHaveBeenCalled()
  })

  it('posts message to parent with ancestorOrigin when embedded in an iframe', () => {
    const postMessageMock = vi.fn()
    const mockParent = {
      postMessage: postMessageMock,
    }
    const mockWindow = {
      parent: mockParent,
      location: {
        ancestorOrigins: ['http://localhost:8000'],
      },
    }
    global.window = mockWindow

    postToParent({ event: 'ws_status', status: 'connected' })
    expect(postMessageMock).toHaveBeenCalledWith(
      { event: 'ws_status', status: 'connected' },
      'http://localhost:8000'
    )
  })

  it('falls back to "*" when ancestorOrigins is undefined or empty', () => {
    const postMessageMock = vi.fn()
    const mockParent = {
      postMessage: postMessageMock,
    }
    const mockWindow = {
      parent: mockParent,
      location: {},
    }
    global.window = mockWindow

    postToParent({ event: 'ws_status', status: 'disconnected' })
    expect(postMessageMock).toHaveBeenCalledWith(
      { event: 'ws_status', status: 'disconnected' },
      '*'
    )
  })

  it('catches and logs warning if postMessage throws', () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {})
    const mockParent = {
      postMessage: vi.fn(() => {
        throw new Error('Blocked cross-origin')
      }),
    }
    const mockWindow = {
      parent: mockParent,
      location: { ancestorOrigins: ['http://localhost:8000'] },
    }
    global.window = mockWindow

    expect(() => {
      postToParent({ event: 'ws_status', status: 'connected' })
    }).not.toThrow()
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Failed to post message to parent window:',
      expect.any(Error)
    )
  })
})

describe('socket class lifecycle and parent notification', () => {
  let mockParent
  let originalWebSocket
  let originalWindow
  let mockWsInstance
  let createdSockets

  class MockWebSocket {
    constructor(url, protocols) {
      this.url = url
      this.protocols = protocols
      this.onopen = null
      this.onclose = null
      this.onmessage = null
      this.onerror = null
      this.close = vi.fn(() => {
        if (this.onclose) {
          this.onclose({ code: 1000 })
        }
      })
      this.send = vi.fn()
      mockWsInstance = this
      createdSockets.push(this)
    }
  }

  beforeEach(() => {
    originalWindow = global.window
    originalWebSocket = global.WebSocket

    createdSockets = []
    mockParent = {
      postMessage: vi.fn(),
    }

    global.window = {
      parent: mockParent,
      location: {
        ancestorOrigins: ['http://localhost:8000'],
        origin: 'http://localhost:3000',
      },
    }
    global.WebSocket = MockWebSocket
    vi.useFakeTimers()
  })

  afterEach(() => {
    global.window = originalWindow
    global.WebSocket = originalWebSocket
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('posts { event: "ws_status", status: "connected" } on open', async () => {
    const testSocket = new socket()
    const onMessageMock = vi.fn()

    const connectPromise = testSocket.connect('token123', onMessageMock)
    expect(mockWsInstance).toBeDefined()

    mockWsInstance.onopen()
    await expect(connectPromise).resolves.toBe('Connection established')

    expect(mockParent.postMessage).toHaveBeenCalledWith(
      { event: 'ws_status', status: 'connected' },
      'http://localhost:8000'
    )
  })

  it('posts { event: "ws_status", status: "disconnected" } on normal or error close', () => {
    const testSocket = new socket()
    testSocket.connect('token123', vi.fn())

    mockWsInstance.onclose({ code: 1006, reason: 'Abnormal closure' })

    expect(mockParent.postMessage).toHaveBeenCalledWith(
      { event: 'ws_status', status: 'disconnected' },
      'http://localhost:8000'
    )
  })

  it('posts { event: "ws_status", status: "unauthorized", redirect: "/cave/auth/login/" } on close code 4401', () => {
    const testSocket = new socket()
    testSocket.connect('token123', vi.fn())

    mockWsInstance.onclose({ code: 4401, reason: 'Unauthorized' })

    expect(mockParent.postMessage).toHaveBeenCalledWith(
      {
        event: 'ws_status',
        status: 'unauthorized',
        redirect: '/cave/auth/login/',
      },
      'http://localhost:8000'
    )
  })

  it('forwards incoming message directly to onMessage callback', async () => {
    const testSocket = new socket()
    const onMessageMock = vi.fn()
    testSocket.connect('token123', onMessageMock)

    const payload = {
      event: 'mutation',
      data: { foo: 'bar' },
    }
    await mockWsInstance.onmessage({
      data: JSON.stringify(payload),
    })

    expect(onMessageMock).toHaveBeenCalledWith(payload)
  })
})
