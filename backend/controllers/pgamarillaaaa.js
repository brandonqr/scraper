var request = require("request");
var cheerio = require("cheerio");
var Observable = require("rxjs/Observable").Observable;
var Subscription = require("rxjs/RX").Subscription;

class PgAmarilla {
    constructor() {
        this.subscription = Subscription;
        this.interval = undefined;
        this.resultadosPorPagina = 15;
        this.contadorPrincipal = 1;
        this.contador = 0;
        this.pgFinal = 0;
        this.nResultados = 0;
        this.url = "";
        this.webs = [];
        this.paginas = [];
    }

    InsertarEnDB(webs) {
            this.webs = JSON.parse(webs);
            this.RecorrerWeb();
        }
        //esta funcion se vuelve  a llamar cuantas veces numeros de webs haya.
    RecorrerWeb() {
            if (this.contadorPrincipal < this.webs.length) {
                this.interval = setInterval(() => {
                    //La siguiente funcion optiene la pagina final y el numero de resultados
                    this.subscription = this.ObtenerPgFinal().subscribe(
                        datos => {
                            console.log(datos);
                            this.pgFinal = datos.pgFinal;
                            this.nResultados = datos.nResultados;
                            this.resultadosPorPagina = datos.resultadosPorPagina;
                            this.RecorrerWeb();
                        },
                        error => {
                            console.log("ha ocurrido un error en obtener pgFinal", error);
                        },
                        () => {
                            console.log("Se ha terminado el observado de obtener pgFinal");
                        }
                    );
                    //el contador suma cuando la funcion se termina de ejecutar
                    this.contadorPrincipal++;
                }, 1000);
            }
        }
        //intentar hacer una funcion recursiva de las peticiones
    RecorrerPaginas() {}
    ObtenerPgFinal() {
        this.url = this.webs[this.contadorPrincipal];
        //la funcion GenerarUrl es para modificar las urls, para que sea mejor su acceso
        this.GenerarUrl();
        //He detenido la ejecucion del interval, para proceder a obtener los datos de la url
        clearInterval(this.interval);
        var pgFinal = 0;
        var resultadosPorPagina = 0;
        var nResultados = 0;
        var datos = {};

        return new Observable(observer => {
            request(this.url, function(error, response, html) {
                if (!error && response.statusCode == 200) {
                    var $ = cheerio.load(html);
                    nResultados = $(".h1")
                        .text()
                        .replace(/[^\d]/g, "");

                    resultadosPorPagina = nResultados < 15 ? nResultados : 15;
                    pgFinal = Math.ceil(nResultados / resultadosPorPagina);

                    datos = {
                        resultadosPorPagina: resultadosPorPagina,
                        pgFinal: pgFinal,
                        nResultados: nResultados
                    };
                    observer.next(datos);
                } else {
                    // observer.error('La web no existe', error);
                }
                // observer.complete();
            });
        });
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
                if (campos[i].includes("?what")) {
                    this.url += this.contadorPrincipal + "?" + campos[i].split("?")[1];
                } else if (campos[i].indexOf(numero)) {
                    this.url += this.contadorPrincipal;
                    console.log("No lleva wtf");
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