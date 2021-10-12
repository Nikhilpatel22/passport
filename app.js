const express = require('express');
const app = express();
const router = require('./controller/routes');
const path = require('path');
require('./database/conn')

app.set('view engine', 'ejs');
app.set('views',path.join(__dirname, 'views'))

app.post('/register', router);
app.get('/login', router);
app.post('/login', router);
app.get('/success', router);
app.get('/logout', router);
app.post('/addmsg', router);
app.get('/',router);
//app.get('/',(req,res)=>{
//	res.send('hello app.js');
//})
module.exports = app;