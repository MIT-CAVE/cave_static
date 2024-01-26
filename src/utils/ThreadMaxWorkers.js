class ThreadMaxWorkers {
  constructor() {
    this.maxWorkers = navigator.hardwareConcurrency || 8
    this.activeWorkers = []
    this.messageQueue = []
  }

  async doWork(message) {
    if (this.activeWorkers.length < this.maxWorkers) {
      console.log('added worker', this.activeWorkers.length)
      return new Promise((resolve, reject) => {
        const worker = new Worker(
          new URL('./computationWorker.js', import.meta.url)
        )
        this.activeWorkers.push(worker)
        worker.postMessage(message)
        worker.onmessage = (e) => {
          resolve(e.data)
          this.processQueue(worker)
        }
        worker.onerror = (e) => {
          this.endWork(worker)
          reject(e)
        }
      })
    } else {
      return new Promise((resolve, reject) => {
        console.log('queued', this.messageQueue.length)
        this.messageQueue.push({ message, resolve, reject })
      })
    }
  }

  async processQueue(worker) {
    if (this.messageQueue.length > 0) {
      const { message, resolve, reject } = this.messageQueue.shift()
      worker.postMessage(message)
      worker.onmessage = (e) => {
        resolve(e.data)
        this.processQueue(worker)
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
    console.log('activeWorker removed', this.activeWorkers.length)
  }
}

export default ThreadMaxWorkers
