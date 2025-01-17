﻿require('rootpath')();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const errorHandler = require('_middleware/error-handler');
const lottorun = require('./users/LottoRun')
const lottorun_ = new lottorun()
const cron = require('node-cron');
const path = require('path');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());




// api routes
app.use('/users', require('./users/users.controller'));
app.use(errorHandler);

app.use(express.static(path.join(__dirname, '/dist')));

app.get("/", (req, res) => {


res.sendFile(path.join(__dirname, '/dist/index.html'));

});

app.get("/login", (req, res) => {


res.sendFile(path.join(__dirname, '/dist/index.html'));

});
app.get("/register", (req, res) => {


res.sendFile(path.join(__dirname, '/dist/index.html'));

});

app.get("/about", (req, res) => {


res.sendFile(path.join(__dirname, '/dist/index.html'));

});

cron.schedule('0 0 * * *', function() {
  lottorun_.Lotto_run()
});



// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 3000) : 3000;
app.listen(port, () => console.log('Server listening on port ' + port));
