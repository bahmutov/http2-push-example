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
      console.log('browser supports HTTP/2 Push!!!')
      pushFile('/images/image1.jpg', files[1], imageOptions, res)
      pushFile('/images/image2.jpg', files[2], imageOptions, res)
    } else {
      console.log('No HTTP/2 Push :(, is page secure?', req.secure)
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

app.listen(8010, err => {
  if (err) {
    throw new Error(err)
  }
  console.log('listening on port 8010')
})
