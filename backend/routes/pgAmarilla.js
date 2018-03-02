var request = require('request');
var cheerio = require('cheerio');
var express = require('express');
var app = express();
var PgAmarilla = require('../controllers/pgAmarilla');

//inicializar variables
p = new PgAmarilla();

//importar el modelo web
var Web = require('../models/web');
// ======================================
// OBTENER COSAS
// ======================================
app.get('/', (req, res, next) => {
    Web.find({})
        .exec(
            (err, webs) => {
                if (err) return;
                res
                    .status(200)
                    .json({
                        //ok: true,
                        webs
                        //mensaje: "Peticion realizada correctamente - paginas amarillas"
                    });

            }
        )

});
// ======================================
// INSERTAR DATOS
// ======================================
app.post('/', (req, res, next) => {

    var webs = req.body.webs;
    var categoria = req.body.categoria;
    //
    if (PgAmarilla.IsJson(webs)) {
        p.InsertarEnDB(webs, categoria);

        res.status(200).json({
            ok: true,
            webs,
            categoria
            //mensaje: JSON.stringify(webs)
        });
    } else {
        res.status(200).json({
            ok: true,
            error: 'error al enviar datos',
            errors: 'error al enviar datos, se tiene que enviar un json array'
        });
    }

    //console.log(JSON.parse(webs));
    // p = new PgAmarilla(webs.web);
    //pgAmarilla = new PgAmarilla(webs);





});

module.exports = app;