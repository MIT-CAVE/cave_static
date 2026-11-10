import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import ThreadMaxWorkers from './ThreadMaxWorkers'

class MockWorker {
  static instances = []

  constructor(url) {
    this.url = url
    this.listeners = {
      message: [],
      error: [],
    }
    this.terminated = false
    this.postedMessages = []
    MockWorker.instances.push(this)
  }

  addEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback)
    }
  }

  removeEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      )
    }
  }

  postMessage(message, transfer) {
    this.postedMessages.push({ message, transfer })
  }

  terminate() {
    this.terminated = true
  }

  emitMessage(data) {
    for (const cb of [...this.listeners.message]) {
      cb({ data })
    }
  }

  emitError(error) {
    for (const cb of [...this.listeners.error]) {
      cb(error)
    }
  }
}

describe('ThreadMaxWorkers', () => {
  const originalWorker = globalThis.Worker

  beforeEach(() => {
    MockWorker.instances = []
  })

  afterEach(() => {
    if (originalWorker) {
      globalThis.Worker = originalWorker
    } else {
      delete globalThis.Worker
    }
  })

  it('falls back to synchronous execution when Worker is undefined', async () => {
    delete globalThis.Worker

    const manager = new ThreadMaxWorkers()
    const result = await manager.doWork({
      valueList: [10, 20],
      groupBys: [1, 2],
      indicies: [0, 1],
      parentLengths: [1],
      groupLength: 2,
    })

    expect(result).toBeDefined()
    expect(typeof result).toBe('object')
  })

  it('creates workers up to maxWorkers and queues overflow tasks', async () => {
    globalThis.Worker = MockWorker

    const manager = new ThreadMaxWorkers()
    manager.maxWorkers = 2

    const p1 = manager.doWork({ id: 1 })
    const p2 = manager.doWork({ id: 2 })
    const p3 = manager.doWork({ id: 3 })

    expect(MockWorker.instances.length).toBe(2)
    expect(manager.workers.length).toBe(2)
    expect(manager.messageQueue.length).toBe(1)

    // Complete task 1
    MockWorker.instances[0].emitMessage('result-1')
    await expect(p1).resolves.toBe('result-1')

    // Task 3 should now be assigned to worker 1
    expect(manager.messageQueue.length).toBe(0)
    expect(MockWorker.instances[0].postedMessages.length).toBe(2)

    // Complete task 2 and task 3
    MockWorker.instances[1].emitMessage('result-2')
    await expect(p2).resolves.toBe('result-2')

    MockWorker.instances[0].emitMessage('result-3')
    await expect(p3).resolves.toBe('result-3')
  })

  it('replaces a destroyed worker to process queued tasks when a worker errors while pool is saturated', async () => {
    globalThis.Worker = MockWorker

    const manager = new ThreadMaxWorkers()
    manager.maxWorkers = 2

    const p1 = manager.doWork({ id: 1 })
    const p2 = manager.doWork({ id: 2 })
    const p3 = manager.doWork({ id: 3 })

    expect(MockWorker.instances.length).toBe(2)
    expect(manager.workers.length).toBe(2)
    expect(manager.messageQueue.length).toBe(1)

    const w1 = MockWorker.instances[0]
    const w2 = MockWorker.instances[1]

    // Simulate worker 1 encountering an error while pool is saturated
    const testError = new Error('Worker 1 crashed')
    w1.emitError(testError)

    // Task 1 should reject
    await expect(p1).rejects.toThrow('Worker 1 crashed')
    expect(w1.terminated).toBe(true)

    // A replacement worker should have been created to take task 3 from the queue
    expect(MockWorker.instances.length).toBe(3)
    const w3 = MockWorker.instances[2]
    expect(manager.workers).toContain(w3)
    expect(manager.workers).not.toContain(w1)
    expect(manager.workers.length).toBe(2)
    expect(manager.messageQueue.length).toBe(0)

    // Task 3 can now resolve via the replacement worker without hanging
    w3.emitMessage('result-3')
    await expect(p3).resolves.toBe('result-3')

    // Worker 2 completes task 2 normally
    w2.emitMessage('result-2')
    await expect(p2).resolves.toBe('result-2')
  })

  it('processes queued tasks when all saturated workers error', async () => {
    globalThis.Worker = MockWorker

    const manager = new ThreadMaxWorkers()
    manager.maxWorkers = 2

    const p1 = manager.doWork({ id: 1 })
    const p2 = manager.doWork({ id: 2 })
    const p3 = manager.doWork({ id: 3 })
    const p4 = manager.doWork({ id: 4 })

    expect(manager.messageQueue.length).toBe(2)

    const w1 = MockWorker.instances[0]
    const w2 = MockWorker.instances[1]

    // Both workers error
    w1.emitError(new Error('Crash 1'))
    w2.emitError(new Error('Crash 2'))

    await expect(p1).rejects.toThrow('Crash 1')
    await expect(p2).rejects.toThrow('Crash 2')

    // Two replacement workers should have been created for p3 and p4
    expect(MockWorker.instances.length).toBe(4)
    expect(manager.messageQueue.length).toBe(0)

    const w3 = MockWorker.instances[2]
    const w4 = MockWorker.instances[3]

    w3.emitMessage('result-3')
    w4.emitMessage('result-4')

    await expect(p3).resolves.toBe('result-3')
    await expect(p4).resolves.toBe('result-4')
  })

  it('rejects queued task if creating replacement worker throws', async () => {
    globalThis.Worker = MockWorker

    const manager = new ThreadMaxWorkers()
    manager.maxWorkers = 1

    const p1 = manager.doWork({ id: 1 })
    const p2 = manager.doWork({ id: 2 })

    expect(manager.messageQueue.length).toBe(1)

    // Mock createWorker throwing when trying to replace the worker
    vi.spyOn(manager, 'createWorker').mockImplementationOnce(() => {
      throw new Error('Failed to spawn worker')
    })

    const w1 = MockWorker.instances[0]
    w1.emitError(new Error('Worker 1 died'))

    await expect(p1).rejects.toThrow('Worker 1 died')
    await expect(p2).rejects.toThrow('Failed to spawn worker')
  })

  it('terminates all workers and clears queues on terminateAll', () => {
    globalThis.Worker = MockWorker

    const manager = new ThreadMaxWorkers()
    manager.maxWorkers = 2

    manager.doWork({ id: 1 })
    manager.doWork({ id: 2 })
    manager.doWork({ id: 3 })

    expect(manager.workers.length).toBe(2)
    expect(manager.messageQueue.length).toBe(1)

    manager.terminateAll()

    expect(manager.workers.length).toBe(0)
    expect(manager.idleWorkers.length).toBe(0)
    expect(manager.messageQueue.length).toBe(0)
    expect(MockWorker.instances[0].terminated).toBe(true)
    expect(MockWorker.instances[1].terminated).toBe(true)
  })
})
