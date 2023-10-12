import { io } from 'socket.io-client'
import socketio from '@nxpkg/socketio'
import { Server } from 'http'
import { clientTests } from '@nxpkg/tests'

import * as nxpkg from '../dist/nxpkg'
import app from './fixture'

describe('Socket.io connector', function () {
  let server: Server
  const socket = io('http://localhost:9988')
  const client = nxpkg.default().configure(nxpkg.socketio(socket))

  before(async () => {
    server = await app((app) => app.configure(socketio())).listen(9988)
  })

  after(function (done) {
    socket.once('disconnect', () => {
      server.close()
      done()
    })
    socket.disconnect()
  })

  clientTests(client, 'todos')
})
