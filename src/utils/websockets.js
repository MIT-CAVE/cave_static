import { decode as msgpackDecoder } from '@msgpack/msgpack'
import * as R from 'ramda'

class socket {
  connect(token, onMessage, wsPath, wsEncoding) {
    return new Promise((resolve) => {
      var connectUrl = R.replace(
        'http',
        'ws',
        window.location.ancestorOrigins[0]
      )
      // Set ws path to /ws/ if not provided
      if (wsPath === undefined) {
        wsPath = '/ws/'
      }
      console.log(wsEncoding)
      // get the decoder based on the encoding
      if (wsEncoding === undefined || wsEncoding === 'json') {
        this.decoder = JSON.parse
      } else if (wsEncoding === 'msgpack') {
        this.decoder = msgpackDecoder
      } else {
        console.error('Invalid encoding provided')
      }

      this.ws = new WebSocket(`${connectUrl}${wsPath}?user_token=${token}`)

      this.ws.onopen = () => {
        console.log('App Socket Connection Established!')
        resolve('Connection established')
      }

      this.ws.onmessage = async (e) => {
        // Listner to take in messages from the websocket consumer
        // parse the sent message and forward it to the onMessage callback

        var data
        // If e.data is a blob, wait for it to be read as an array buffer
        if (e.data instanceof Blob) {
          data = await e.data.arrayBuffer()
        } else {
          data = e.data
        }
        // Decode and forward the data to the onMessage callback
        onMessage(this.decoder(data))
      }

      this.ws.onclose = (e) => {
        console.log(
          'App Socket disconnected. Attempting to reconnect in 3 seconds...'
        )
        console.log(e)
        setTimeout(() => {
          this.connect(token, onMessage, wsPath, wsEncoding)
        }, 3000)
      }

      this.ws.onerror = (err) => {
        console.error(
          'App Socket encountered an error: ',
          err.message,
          'Closing...'
        )
        this.ws.close()
      }
    })
  }

  send(data) {
    this.ws.send(JSON.stringify(data))
  }
}

const socketInstance = new socket()

export default socketInstance
