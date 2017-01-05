var fs = require('fs')
var http2 = require('http2')
var express = require('express')
var app = express()

app.get('/', function (req, res) {
  console.log('/')
  // res.send('hello, http2!')

  res.writeHead(200)
  res.end()
})

function listen(req, res) {
  console.log('/')
  // res.send('hello, http2!')

  res.writeHead(200)
  res.end()
}

// var options = {
//   key: fs.readFileSync('./server.key'),
//   cert: fs.readFileSync('./server.crt')
// };

var options = {}

http2.raw.createServer(options, listen).listen(8080)
