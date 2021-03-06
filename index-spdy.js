const spdy = require('spdy')
const express = require('express')
const fs = require('mz/fs')
const morgan = require('morgan')

const app = express()
app.use('/_logger', require('inline-log')({limit: 100}))
app.use(morgan('dev'))

app.get('/', serveHome)

app.use(express.static('public'))

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

function serveHome (req, res) {
  console.log('serving home')

  const homePageWithPush = files => {
    if (res.push) {
      console.log('browser supports HTTP/2 Push!!!',
        'is SPDY?', req.isSpdy, 'spdy version', req.spdyVersion)
      pushFile('/images/image1.jpg', files[1], imageOptions, res)
      pushFile('/images/image2.jpg', files[2], imageOptions, res)
    } else {
      console.log('No HTTP/2 Push :(, is page secure?',
        req.secure, 'is SPDY?', req.isSpdy)
    }

    // index.html is the first file
    res.writeHead(200)
    res.end(files[0])
  }

  // we could also read all files at startup
  Promise.all(readFiles())
    .then(homePageWithPush)
    .catch(error => res.status(500).send(error.toString()))
}

const tlsOptions = {
  key: fs.readFileSync('./server.key'),
  cert: fs.readFileSync('./server.crt'),
  spdy: {
    plain: false,
    ssl: true
  }
}
const plainOptions = {
  spdy: {
    plain: true,
    ssl: false,
    protocolos: ['h2','spdy/3.1', 'spdy/3', 'spdy/2','http/1.1', 'http/1.0'],
    protocol: 'h2'
  }
}

spdy.createServer(tlsOptions, app).listen(8010, err => {
  if (err) {
    throw new Error(err)
  }
  console.log('listening on port 8010')
})
