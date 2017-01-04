// const spdy = require('spdy')
const express = require('express')
const fs = require('mz/fs')
const morgan = require('morgan')

const app = express()
app.use(morgan('dev'))
app.use(express.static('public'))

function readFiles () {
  const files = [
    'public/index.html',
    'public/images/banner1.jpg',
    'public/images/hoare.jpg'
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
      console.log('browser supports HTTP/2 Push!!!')
      pushFile('/images/banner1.jpg', files[1], imageOptions, res)
      pushFile('/images/hoare.jpg', files[2], imageOptions, res)
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

app.get('/home', serveHome)

spdy.createServer({
  key: fs.readFileSync('./server.key'),
  cert: fs.readFileSync('./server.crt')
}, app).listen(8010, err => {
  if (err) {
    throw new Error(err)
  }
  console.log('listening on port 8010')
})
