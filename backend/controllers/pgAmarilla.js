var request = require('request');
var cheerio = require('cheerio');
var Rx = require('rxjs/Rx');
var Observable = require('rxjs/Observable').Observable;

class PgAmarilla {
    constructor() {
        //recibe un array de web en el metodo post
        this.intervalo = undefined;
        this.subscription = Rx.Subscription();
        this.resultadosPorPagina = 15;
        this.contadorPrincipal = 0;
        this.contadorSecundario = 1;
        this.contadorTerciario = 0;
        this.pgFinal = 0;
        this.nResultados = 0;
        this.url = "";
        this.webs = [];
        this.paginas = [];
    }

    InsertarEnDB(webs) {
        this.webs = JSON.parse(webs);
        this.RecorrerWebs();

        // this.RecorrerWebs();
    }
    RecorrerWebs() {

        if (this.contadorPrincipal < this.webs.length) {
            this.url = this.webs[this.contadorPrincipal];
            this.Obs_ObtenerPgFinal().subscribe(datos => {
                    this.pgFinal = datos.pgFinal;
                    this.nResultados = datos.nResultados;
                    console.log(`url: ${this.url}`);
                    console.log(`pgFinal: ${this.pgFinal}`);
                    console.log(`nResultados: ${this.nResultados}`);

                    this.Obs_RecorrerPaginas().subscribe(paginas => {
                            this.paginas = paginas;
                            console.log(`paginas : ${paginas}`);



                            this.Obs_ObtenerDatos().subscribe(objeto => {
                                    console.log(`Objeto ${this.contadorTerciario}`)
                                        //if (objeto != undefined)
                                        //primero comprobar si existe en la base de datos
                                        //insertar en la base de datos
                                    console.log(objeto);
                                    var resultados = (this.nResultados < 15) ? this.nResultados : 15;
                                    console.log(`Resultados ${resultados}`)
                                    if (this.contadorTerciario < resultados)
                                        this.RecorrerWebs();
                                    else {
                                        this.contadorTerciario = 0;
                                        this.RecorrerWebs();
                                    }


                                }, (error) => console.log('error'),
                                () => {
                                    this.RecorrerWebs();
                                })




                            //cuando se acabe de ejecutar ese observable, ejecutamos el codigo de abajo.

                        },
                        (error) => console.log('ajaja'),
                        () => {
                            console.log('final')
                            this.contadorPrincipal++;
                            this.contadorSecundario = 1;
                            //console.log(datos.nResultados);
                            this.RecorrerWebs();
                        }
                    )


                },
                (error) => console.log('aaa'),
                () => console.log('Fin')
            )

        }
    }
    Obs_ObtenerDatos() {

        return new Observable(observer => {
            var url = this.paginas[this.contadorTerciario];
            var objeto = '';
            request(url, function(error, response, html) {
                if (!error && response.statusCode == 200) {
                    var $ = cheerio.load(html);
                    objeto = $("body > div:nth-child(5)").attr("data-business");
                    observer.next(objeto);
                }
            });
            this.contadorTerciario++;
        });


    }

    Obs_RecorrerPaginas() {
        this.GenerarUrl();
        this.contadorSecundario++;
        return new Observable(observer => {
            var weblist = [];
            var uri = "";
            request(this.url, function(error, response, html) {
                if (!error && response.statusCode == 200) {
                    var $ = cheerio.load(html);
                    $(".envio-consulta a").each(function(index) {
                        uri = $(this).attr("href");
                        weblist.push(uri);
                    });
                    observer.next(weblist);
                }
            });
        });



    }
    Obs_ObtenerPgFinal() {
        //console.log(this.url);
        return new Observable(
            observer => {
                var nResultados = 0;
                var pgFinal = 0;
                request(
                    this.url,
                    function(
                        error,
                        response,
                        html
                    ) {
                        if (!error &&
                            response.statusCode ==
                            200
                        ) {
                            var $ = cheerio.load(
                                html
                            );
                            nResultados = $(
                                    ".h1"
                                )
                                .text()
                                .replace(
                                    /\D/g,
                                    ""
                                ); //sólo números
                            pgFinal = Math.ceil(
                                nResultados / 15
                            );
                            var datos = {
                                nResultados: nResultados,
                                pgFinal: pgFinal
                            };
                            observer.next(
                                datos
                            );
                        }
                    }
                );
            }
        );
    }

    GenerarUrl() {
        console.log(`contador secundario ${this.contadorSecundario}`)
        let campos = this.url.split("/");
        this.url = ""; //dejar vacia la url para poder modificarla
        var numero = new RegExp("/D/g");
        for (let i = 0; i < campos.length; i++) {
            if (i < campos.length - 1) {
                this.url += campos[i] + "/";
            } else {
                //si los enleces contienen la palabra ?what entra por aqui
                if (campos[i].includes("?what")) {
                    this.url += this.contadorSecundario + "?" + campos[i].split("?")[1];
                } else if (campos[i].indexOf(numero)) {
                    this.url += this.contadorSecundario;
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
        /*
    RecorrerWebs() {
        this.url = this.webs[this.contadorPrincipal];
        this.subscription = this.ObsRecorrerWeb().subscribe(
            datos => {
                this.pgFinal = datos.pgFinal;
                this.nResultados = datos.nResultados;
                //this.RecorrerPaginas();

                //this.contadorPrincipal++;
                if (this.contadorPrincipal < this.webs.length) {
                    this.subscription.unsubscribe(); //terminar la suscripcion..Evita que el observador se siga ejecutando cuando acabe su trabajo.

                    //this.RecorrerWebs();
                }
            },
            error => console.log("error en el obs", error),
            () => console.log("Se ha finalizado el observador")
        );
    }
    ObsRecorrerWeb() {
            console.log("Recorrer web observador principal");
            this.GenerarUrl(); //genera un url con el valor actual del  contadorSecundario
            // console.log(this.url);
            return new Observable(observer => {
                request(this.url, (error, response, html) => {
                    if (!error && response.statusCode == 200) {
                        var $ = cheerio.load(html);
                        //console.log(this.url);
                        observer.next(this.url);
                    } else {
                        //console.log('La pagina no existe o se ha perdido la conexión')
                        observer.error("La pagina no existe o se ha perdido la conexión");
                    }
                    if (this.contadorSecundario === this.pgFinal) observer.complete();
                    this.contadorPrincipal++;
                    this.RecorrerWebs();
                });
            });
        }
        /*
    RecorrerWebs() {
        this.url = this.webs[this.contadorPrincipal];

        this.subscription = this.ObtenerPaginaFinal(this.url).subscribe(datos => {
                this.pgFinal = datos.pgFinal;
                this.nResultados = datos.nResultados;
                this.RecorrerPaginas();

                //this.contadorPrincipal++;
                if (this.contadorPrincipal < this.webs.length) {
                    this.subscription.unsubscribe(); //terminar la suscripcion..Evita que el observador se siga ejecutando cuando acabe su trabajo.

                    //this.RecorrerWebs();
                }
            },
            error => console.log('error en el obs', error),
            () => console.log('Se ha finalizado el observador')
        );

    }
    RecorrerPaginas() {
        console.log("recorrerPaginas")
        this.GenerarUrl(); //genera un url con el valor actual del  contadorSecundario
        //console.log(this.url);
        //  console.log(`imprimiendo url ${this.url} con ${this.pgFinal} paginas`)
        //  console.log(' ');

        //console.log(this.url);
        //generar urls
        // ======================================
        // subscription
        // ======================================


        this.subscription = this.ObtenerDatos().subscribe(datos => {
                console.log('Url devuelta', datos);
                //if()
                this.RecorrerPaginas();


                // console.log(`Contador secundario ${this.contadorSecundario}`)
                // console.log(`$this.pgFinal ${this.pgFinal}`)
                if (this.contadorSecundario < this.nResultados) {
                    console.log(`paginal Final ${this.pgFinal}`)
                    this.subscsription.unsubscribe(); //terminar la suscripcion..Evita que el observador se siga ejecutando cuando acabe su trabajo.
                    this.contadorSecundario++;
                    this.RecorrerPaginas();

                }

            },
            error => console.log('error en el obs', error),
            () => console.log('Se ha finalizado el observador')
        );


    }
    ObtenerDatos() {
        console.log("obteniendo datos");
        return new Observable(observer => {
            request(this.url, (error, response, html) => {
                if (!error && response.statusCode == 200) {
                    var $ = cheerio.load(html);
                    //console.log(this.url);
                    observer.next(this.url);
                } else {
                    //console.log('La pagina no existe o se ha perdido la conexión')
                    observer.error('La pagina no existe o se ha perdido la conexión');
                }
                if (this.contadorSecundario === this.pgFinal)
                    observer.complete();
                this.contadorPrincipal++;
                this.RecorrerWebs();
            });
        })
    }
    GenerarUrl() {
        let campos = this.url.split("/");
        this.url = ''; //dejar vacia la url para poder modificarla
        for (let i = 0; i < campos.length - 1; i++) {
            this.url += campos[i] + "/";

        }
        this.url += this.contadorSecundario;
    }
    ObtenerPaginaFinal(url) {
        return new Observable(observer => {
            var pgFinal = 0;
            var nResultados = 0;
            request(url, (error, response, html) => {
                if (!error && response.statusCode == 200) {
                    var $ = cheerio.load(html);
                    nResultados = $(".h1").text()
                        .replace(/\D/g, ''); //sólo números
                    pgFinal = Math.ceil(this.nResultados / 15);
                    //console.log(pgFinal);
                    //Obtiene la pagina final
                    let contenido = { pgFinal: pgFinal, nResultados: this.nResultados };
                    observer.next(contenido);
                } else {
                    //console.log('La pagina no existe o se ha perdido la conexión')
                    observer.error('La pagina no existe o se ha perdido la conexión');
                }
                observer.complete();
            });

        }).retryWhen(err => {
            console.log('La pagina no existe o se ha perdido la conexión');
            this.subscription.unsubscribe();
            return err;
        })

    }
    static IsJson(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }



















    /*
        RecorrerArray() {

            //recorrer todas las this.webs del array
            //pagin final
            this.subscription = this.ObtenerPgFinal()
                .subscribe(
                    pgFinal => {
                        //console.log(pgFinal)
                        this.Prueba(pgFinal).subscribe(cosas => {
                            console.log('Imprimiendo desde subscribe de prueba');
                            console.log(cosas);
                        });
                    },
                    error => console.log('Error:', error),
                    () => console.log('El subscribe ha finalizado')
                );
        }
        Prueba(pgFinal) {
            return new Observable(observer => {
                console.log("imprimiendo pg final desde PRueba")
                console.log(pgFinal);
                observer.next(this.web);
                /*
                var campos = this.web.split('/');

                for (let i = 0; i < pgFinal; i++) {
                    var url = '';
                    for (let j = 0; j < campos.length - 1; j++) {

                        url += campos[j] + "/";

                    }
                    url += i + 1;
                    console.log(url);
                    console.log(' ');


                }
    console.log(this.web);
});
}


ObtenerPgFinal() {

    return new Observable(observer => {
        var pgFinal = 0;
        request(
            this.web,
            (error, response, html) => {

                if (!error && response.statusCode == 200) {
                    var $ = cheerio.load(html);
                    pgFinal = $(".h1").text()
                        .replace(/\D/g, ''); //sólo números
                    pgFinal = Math.ceil(pgFinal / 15);
                    //Obtiene la pagina final
                    observer.next(pgFinal);
                } else {
                    //console.log('La pagina no existe o se ha perdido la conexión')
                    observer.error('La pagina no existe o se ha perdido la conexión');
                }
                observer.complete();
            }
        );
    }).retryWhen(err => {
        console.log('La pagina no existe o se ha perdido la conexión');
        this.subscription.unsubscribe();
        return err;
    })
}
RegresaObservable() {

    return new Observable(observer => {

            let contador = 0;

            let intervalo = setInterval(() => {

                contador++;
                /*
                request('https://news.ycombinator.com', (error, response, html) => {
                    if (!error && response.statusCode == 200) {
                        console.log(html);
                    }
                });
                
    let salida = {
        valor: contador
    };

    observer.next(salida);

}, 500);
})
.retry()
    .map(res => {
        return res.valor;
    })
    .filter((valor, index) => {

        if (valor % 2 === 1) {
            return true;
        } else {
            return false;
        }
    });
}

*/
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