//Requires
var request = require('request');
var cheerio = require('cheerio');
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var BASE_DE_DATOS_URI = require('./config').BASE_DE_DATOS_URI;

//Inicializar variables
var app = express();

//parse application/x-www-form-urlencoded
app.use(bodyParser
    .urlencoded({ extended: false }));
//parse application/json
app.use(bodyParser.json());

//importar rutas
var appRoutes = require('./routes/app');
var pgAmarillaRoutes = require('./routes/pgAmarilla');

//conexxion a la base de datos
mongoose.connection.openUri(BASE_DE_DATOS_URI, (err, res) => {
    //si hay un error, no se hace nada
    if (err) throw err;
    //si no hay error la base de datos se inicia
    console.log('Base de datos online')
})

//rutas
app.use('/paginas-amarillas', pgAmarillaRoutes);
app.use('/', appRoutes);




//iniciar el servidor
app.listen(3000, () => {
    console.log('Servidor online');
})