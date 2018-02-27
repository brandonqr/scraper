var mongose = require('mongoose');
var Schema = mongose.Schema;

var webSchema = new Schema({
    fuente: { type: String },
    nombre: { type: String },
    actividad: { type: String },
    telefono: { type: String },
    email: { type: String },
    web: { type: String },
    provincia: { type: String },
    localidad: { type: String },
    direccion: { type: String }

});
module.exports = mongose.model('Web', webSchema);
/*
nombre
actividad
email
web
telefono
localidad
provincia
direccion




*/