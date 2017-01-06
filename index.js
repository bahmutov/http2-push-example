const server = require('https')
const express = require('express')
const fs = require('mz/fs')
const morgan = require('morgan')

const app = express()
app.use('/_logger', require('inline-log')({limit: 100}))
app.use(morgan('dev'))
app.use(express.static('public'))

const tlsOptions = {
  key: fs.readFileSync('./server.key'),
  cert: fs.readFileSync('./server.crt'),
}
const port = process.env.PORT || 5000
server.createServer(tlsOptions, app).listen(port, err => {
  if (err) {
    throw new Error(err)
  }
  console.log('listening on port', port)
})
