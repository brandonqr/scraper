var request = require("request");
var cheerio = require("cheerio");
var Observable = require("rxjs/Observable").Observable;
var Subscription = require("rxjs/RX").Subscription;
var Web = require('../models/web');

class PgAmarilla {
    constructor() {
        this.subscription = Subscription;
        this.interval = undefined;
        this.resultadosPorPagina = 15;
        this.contadorPrincipal = 0;
        this.contador = 0;
        this.pgFinal = 0;
        this.nResultados = 0;
        this.url = "";
        this.webs = [];
        this.paginas = [];
        this.fuente = '';

    }

    InsertarEnDB(webs, categoria) {
            this.categoria = categoria;
            this.webs = JSON.parse(webs);
            this.contadorPrincipal = 0;
            this.contador = 0;
            this.Empezar();

        }
        //inserta a la base de datos
    Insertar(objeto) {
        //console.log(objeto);
        var web = new Web({
            fuente: this.fuente,
            web_id: objeto.info.id,
            categoria: this.categoria,
            nombre: objeto.info.name,
            actividad: objeto.info.activity || " ",
            telefono: objeto.info.phone || " ",
            email: objeto.customerMail || " ",
            web: objeto.adWebEstablecimiento || " ",
            provincia: objeto.location.province || " ",
            localidad: objeto.location.locality || " ",
            direccion: objeto.info.businessAddress || " "
        });
        //comprueba si el Objeto está insertado en la base de datos
        Web.findOne({ web_id: objeto.info.id }, function(err, webAbuscar) {
            if (err) {
                return;
            }
            if (!webAbuscar) {
                //Si el objeto no existe, lo inserta en la DB
                web.save((err, web) => {
                    if (err) {
                        return;
                    }
                    console.log("Objeto insertado");
                });
            } else {
                console.log("El objeto ya está insertado en la DB");
            }
            return true;
        });
    }

    //EMpezar: Obtiene la pgFinal, los resultados por pagina y numero de resultados
    Empezar() {

        console.log("======================================");
        console.log(this.contadorPrincipal);
        console.log("======================================");

        this.subscription = this.RecorrerWeb().subscribe(
            datos => {
                this.pgFinal = datos.pgFinal;
                this.resultadosPorPagina =
                    datos.resultadosPorPagina;
                this.nResultados = datos.nResultados;
                this.fuente = datos.fuente;
                this.RecorrerPaginas();
            }
        );
    }
    ObtenerDatos(uri) {
        var obsObtenerDatos = new Observable(observer => {
            request(uri, function(
                error,
                response,
                html
            ) {
                if (!error && response.statusCode == 200) {
                    var $ = cheerio.load(html);
                    var objeto = $("body > div:nth-child(5)").attr("data-business");
                    observer.next(objeto);
                } else {
                    observer.error('Error al obtener los objetos');
                }
                observer.complete();
            });
        });

        obsObtenerDatos.subscribe(
            objeto => {
                //console.log(objeto)
                //Insertar en la Base de datos
                try {
                    this.Insertar(JSON.parse(objeto));
                } catch (error) {
                    console.log(error);
                }

            },
            (error) => error,
            () => {
                //En éste punto es el fin del script de 1 url
                //primero comparar de cuanta longitud es nuestro array de urls

                //console.log(this.webs.length);

                if (this.contadorPrincipal < this.webs.length - 1) { //llamar a empezar para ir por la siguiente url

                    this.contadorPrincipal++;
                    this.Empezar();
                    //sumar+1 al this.contador -> es el contador de los arrays

                    //poner a cero el this.contadorSecundario, es el contador de las paginas
                    this.contador = 0;

                }
                console.log("Ha terminado la ulr", this.contadorPrincipal);

            })

    }
    RecorrerPaginas() {
            this.GenerarUrl();
            //console.log('Recorrer paginas', this.url);
            var obsRecorrerPaginas = new Observable(observer => {
                request(this.url, function(
                    error,
                    response,
                    html
                ) {
                    if (!error && response.statusCode == 200) {
                        var $ = cheerio.load(html);
                        $(".envio-consulta a").each(function(
                            index
                        ) {
                            var uri = $(this).attr("href");
                            observer.next(uri);
                        });
                    } else {
                        observer.error();
                    }
                    observer.complete();
                });
            });

            obsRecorrerPaginas.subscribe(uri => {
                    //llamar a funcion donde recorra las paginas y obtenga los objetos(datos)
                    this.ObtenerDatos(uri)
                        //console.log(uri);

                }, (error) => error,
                () => {
                    //console.log('Ha finalizado');
                    if (this.contador < this.pgFinal) {
                        this.contador++;
                        this.RecorrerPaginas();
                    }

                });

        }
        //esta funcion se vuelve  a llamar cuantas veces numeros de webs haya.
    RecorrerWeb() {
        this.url = this.webs[this.contadorPrincipal];
        //console.log(this.url);
        return new Observable(observer => {
            request(this.url, function(
                error,
                response,
                html
            ) {
                if (!error && response.statusCode == 200) {
                    var $ = cheerio.load(html);
                    var nResultados = $(".h1")
                        .text()
                        .replace(/[^\d]/g, "");
                    var fuente = $(".logo").attr("title");
                    var resultadosPorPagina = nResultados < 15 ? nResultados : 15;
                    var pgFinal = Math.ceil(nResultados / resultadosPorPagina);

                    var datos = {
                        nResultados: nResultados,
                        resultadosPorPagina: resultadosPorPagina,
                        pgFinal: pgFinal,
                        fuente: fuente
                    }
                    observer.next(datos);
                }
            });
        })
    }
    GenerarUrl() {
        let campos = this.url.split("/");
        this.url = ""; //dejar vacia la url para poder modificarla
        var numero = new RegExp("/D/g");
        for (let i = 0; i < campos.length; i++) {
            if (i < campos.length - 1) {
                this.url += campos[i] + "/";
            } else {
                //si los enleces contienen la palabra ?what entra por aqui
                if (campos[i].includes("?")) {
                    this.url += this.contador + 1 + "?" + campos[i].split("?")[1];
                } else if (campos[i].indexOf(numero)) {
                    this.url += this.contador + 1;
                    //console.log("No lleva wtf");
                } else {
                    //console.log(campos[i].split('?')[0]);
                    console.log("la url no es valida");
                }
            }
            //console.log(this.url);

            //this.url += this.contadorSecundario;
        }
        //this.url += campos[i] + "/";
    }
    static IsJson(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }
}
module.exports = PgAmarilla;
/*FUNCIONALIDAD */
/*
Se envia una url por post y se obtienen los datos.
PLANTEAMIENTO 1
1.  Recibe una array de webs
2.  Recorre la web y obtiene los enlaces de todas las webs de la pagina
3.  Recorre todas las webs y obtiene los datos y las guarda en un array
4.  Recorre el Array y las inserta en la base de datos
PLANTEAMIENTO 2
1.  Recibe un Array De Webs
2.  Recorre la web
3.  Obtiene los enlaces de las paginas
4.  Recorre cada pagina e inserta en la base de datos
5.  Ejemplo:
    WebPrincipal: (Recorrer todas las web con esa busqueda)
        PaginaDeFulanito:
            Recoge datos de la pagina de fulanito:
                Comprueba si los datos existen:
                    si: Inserta en la base de datos
                    no: No hace nada
                                
https://www.paginasamarillas.es/search/bicicletas/all-ma/all-pr/all-is/all-ci/all-ba/all-pu/all-nc/1

https://www.paginasamarillas.es/search/vinos/all-ma/all-pr/all-is/all-ci/all-ba/all-pu/all-nc/1

https://www.paginasamarillas.es/search/cosas/all-ma/all-pr/all-is/all-ci/all-ba/all-pu/all-nc/1


*/