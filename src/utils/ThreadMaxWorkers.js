class ThreadMaxWorkers {
  constructor() {
    this.maxWorkers = navigator.hardwareConcurrency || 8
    this.activeWorkers = []
    this.messageQueue = []
  }

  doWork(message) {
    if (this.activeWorkers.length < this.maxWorkers) {
      return new Promise((resolve, reject) => {
        const worker = new Worker(
          new URL('./computationWorker.js', import.meta.url)
        )
        this.activeWorkers.push(worker)
        worker.postMessage(message)
        worker.onmessage = (e) => {
          this.processQueue(worker)
          resolve(e.data)
        }
        worker.onerror = (e) => {
          this.endWork(worker)
          reject(e)
        }
      })
    } else {
      return new Promise((resolve, reject) => {
        this.messageQueue.push({ message, resolve, reject })
      })
    }
  }

  processQueue(worker) {
    if (this.messageQueue.length > 0) {
      const { message, resolve, reject } = this.messageQueue.shift()
      worker.postMessage(message)
      worker.onmessage = (e) => {
        this.processQueue(worker)
        resolve(e.data)
      }
      worker.onerror = (e) => {
        this.endWork(worker)
        reject(e)
      }
    } else {
      this.endWork(worker)
    }
  }

  endWork(worker) {
    worker.terminate()
    this.activeWorkers = this.activeWorkers.filter((w) => w !== worker)
  }
}

export default ThreadMaxWorkers
