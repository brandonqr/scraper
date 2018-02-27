var express = require('express');
var app = express();

//importar el modelo web
var Web = require('../models/web');

app.get('/', (req, res, next) => {
    res.status(200).json({
        ok: true,
        mensaje: 'Peticion realizada correctamente - paginas amarillas'
    });
});

module.exports = app;