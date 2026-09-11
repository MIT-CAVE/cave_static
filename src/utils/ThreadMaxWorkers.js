const group = (groupBys, indicies, valueLists, parentLengths, groupLength) => {
  const acc = {}
  for (let i = 0; i < indicies.length; i++) {
    let subAcc = acc
    let baseLength = 0
    for (let j = 0; j < parentLengths.length; j++) {
      const idx = indicies[i]
      const key = groupBys
        .slice(
          parentLengths[j] * idx + baseLength,
          parentLengths[j] * (idx + 1) + baseLength
        )
        .join(' \u279D ')
      if (j === parentLengths.length - 1) {
        if (!(key in subAcc)) {
          subAcc[key] = 0
        }
        subAcc[key] += valueLists[idx]
      } else {
        if (!(key in subAcc)) {
          subAcc[key] = {}
        }
        subAcc = subAcc[key]
      }
      baseLength += parentLengths[j] * groupLength
    }
  }
  return acc
}

class ThreadMaxWorkers {
  constructor() {
    this.maxWorkers =
      typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 8 : 8
    this.workers = []
    this.idleWorkers = []
    this.messageQueue = []
  }

  createWorker() {
    const worker = new Worker(
      new URL('./computationWorker.js', import.meta.url)
    )
    this.workers.push(worker)
    return worker
  }

  assignWork(worker, { message, transfer, resolve, reject }) {
    const onMessage = (e) => {
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
      this.releaseWorker(worker)
      resolve(e.data)
    }
    const onError = (e) => {
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
      this.destroyWorker(worker)
      reject(e)
    }

    worker.addEventListener('message', onMessage)
    worker.addEventListener('error', onError)

    if (transfer && transfer.length > 0) {
      worker.postMessage(message, transfer)
    } else {
      worker.postMessage(message)
    }
  }

  releaseWorker(worker) {
    if (this.messageQueue.length > 0) {
      const task = this.messageQueue.shift()
      this.assignWork(worker, task)
    } else {
      this.idleWorkers.push(worker)
    }
  }

  destroyWorker(worker) {
    worker.terminate()
    this.workers = this.workers.filter((w) => w !== worker)
    this.idleWorkers = this.idleWorkers.filter((w) => w !== worker)
  }

  doWork(message, transfer) {
    if (typeof Worker === 'undefined') {
      const { valueList, groupBys, indicies, parentLengths, groupLength } =
        message
      const indiciesArr = new Uint32Array(indicies)
      const valueListArr = new Float64Array(valueList)
      const groupBysArr = new Uint32Array(groupBys)
      const result = group(
        groupBysArr,
        indiciesArr,
        valueListArr,
        parentLengths,
        groupLength
      )
      return Promise.resolve(result)
    }
    return new Promise((resolve, reject) => {
      const task = { message, transfer, resolve, reject }

      if (this.idleWorkers.length > 0) {
        const worker = this.idleWorkers.pop()
        this.assignWork(worker, task)
      } else if (this.workers.length < this.maxWorkers) {
        const worker = this.createWorker()
        this.assignWork(worker, task)
      } else {
        this.messageQueue.push(task)
      }
    })
  }

  terminateAll() {
    for (const worker of this.workers) {
      worker.terminate()
    }
    this.workers = []
    this.idleWorkers = []
    this.messageQueue = []
  }
}

export default ThreadMaxWorkers
