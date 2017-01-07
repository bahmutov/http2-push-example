const server = require('spdy')
const express = require('express')
const fs = require('mz/fs')
const morgan = require('morgan')

const app = express()
app.use(morgan('dev'))

function readFiles () {
  const files = [
    'public/index.html',
    'public/images/image1.jpg',
    'public/images/image2.jpg'
  ]
  return files.map(name => fs.readFile(name))
}

function pushFile (path, contents, options, res) {
  const stream = res.push(path, options)
  stream.on('error', console.error)
  stream.end(contents)
}

const imageOptions = {
  req: {accept: 'image/*'},
  res: {'content-type': 'image/jpeg'}
}

function serveHome (index, image1, image2) {
  console.log('making home page middleware')
  return function (req, res) {
    console.log('serving home')

    if (res.push && !process.env.PUSH_DISABLED) {
      console.log('browser supports HTTP/2 Push!!!',
        'is SPDY?', req.isSpdy, 'spdy version', req.spdyVersion)
      pushFile('/images/image1.jpg', image1, imageOptions, res)
      pushFile('/images/image2.jpg', image2, imageOptions, res)
    } else {
      console.log('No HTTP/2 Push :(, is page secure?',
        req.secure, 'is SPDY?', req.isSpdy)
    }
    res.writeHead(200)
    res.end(index)
  }
}

const tlsOptions = {
  key: fs.readFileSync('./server.key'),
  cert: fs.readFileSync('./server.crt'),
  spdy: {
    plain: false,
    ssl: true
  }
}

function startServer (files) {
  app.get('/', serveHome(files[0], files[1], files[2]))
  app.use(express.static('public'))

  const port = process.env.PORT || 5000
  server.createServer(tlsOptions, app).listen(port, err => {
    if (err) {
      throw new Error(err)
    }
    console.log('listening on port', port)
  })
}

Promise.all(readFiles())
  .then(startServer)
  .catch(error => console.error(error.toString()))
