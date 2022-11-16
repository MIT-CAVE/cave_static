import * as R from 'ramda'

class socket {
  connect(token, onMessage) {
    return new Promise((resolve) => {
      var connectUrl = R.replace(
        'http',
        'ws',
        window.location.ancestorOrigins[0]
      )
      this.ws = new WebSocket(`${connectUrl}/ws/?user_token=${token}`)

      this.ws.onopen = () => {
        console.log('App Socket Connection Established!')
        resolve('Connection established')
      }

      this.ws.onmessage = (e) => {
        // Listner to take in messages from the websocket consumer
        // parse the sent message and forward it to the onMessage callback
        // NOTE: The WS consumer auto formats the sent message payload
        // in a json string as `e.data` so we parse that out here
        var payload = JSON.parse(e.data)
        onMessage(payload)
      }

      this.ws.onclose = (e) => {
        console.log(
          'App Socket disconnected. Attempting to reconnect in 3 seconds...'
        )
        console.log(e)
        setTimeout(() => {
          this.connect(token, onMessage)
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

export default new socket()
