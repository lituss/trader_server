
//TODO actualitzar base dades
    // TODO eliminar duplicats
    // TODO tractar salts
    // TODO actualitzar fins avui el parell gdax btc-EUR

const sql = require('./sql.js');
//const ti = require('technicalindicators');
//ti.setConfig('precision', 10);
const sql2 = require('./sql2.js');
const {Bitlletera,Mayor} = require('./contab.js');

class Simula{
    
    calculaSistema(parametresSistema){
        var indexCandles;
        //console.log('simula candles : '+JSON.stringify(this.candles));
        this.Sistema = new llistaSistemes[parametresSistema.classe](this.candles,parametresSistema);
        var resultat = this.Sistema.getResult();
        console.log('calcul sistema : '+resultat);
        for (indexCandles = 0 ; indexCandles < this.candles.length ; indexCandles ++){
            /*resultat = 0;
            for (itera = 0 ; itera < this.indicadors.lenght ; itera ++){
               resultat +=this.indicadors[itera].calcula(this.candles[indexCandles]);            }
            */
           //if (indexCandles > 2707) 
           //     console.log('resultat['+indexCandles+'] = '+resultat[indexCandles]);
            if (resultat[indexCandles] > 0){
                 this.bitlletera.compra(this.candles[indexCandles]);
            }
            else {
                if (resultat[indexCandles] < 0) {
                    this.bitlletera.ven(this.candles[indexCandles]);
                }
            }
        }
        this.bitlletera.mostraResultats();
    }

    enviaResultats(){
        let paquet={};
        paquet.tipus = "resultats";
        paquet.data = {'data': this.Sistema.getAll(),'llibre': this.bitlletera.getAll()};
        console.log('enviant dades ...');
        //console.log('llibre : '+JSON.stringify(paquet.data.llibre));
        this.ws.send(JSON.stringify(paquet));
    }

    constructor (exchange,pair,initialDate,endDate,granularity,Sistema,saldoInicial,ws){
        this.candles=[];
        this.exchange = exchange;
        this.pair = pair;
        this.initialDate = initialDate;
        this.endDate = endDate;
        this.granularity = granularity;
        this.ws = ws;
        //this.candles = await sql.getCandles(exchange,pair,initialDate,endDate,granularity);
        this.bitlletera = new Bitlletera('GDAX','BTC','EUR',0,saldoInicial,0.003,0,initialDate);
        //this.Sistema = Sistema;
        //this.calculaCandles();
        this.inicia(Sistema);
    }
    async inicia(Sistema){
        this.candles = await sql2.getCandles(this.exchange,this.pair,this.initialDate,this.endDate,this.granularity);
        if (!this.candles){
            console.log('No se han encontrado velas');
            process.exit();
        }
        console.log('inicia , candles : '+this.candles.length);
        await this.calculaSistema(Sistema);
        this.enviaResultats();
    }

}

//lsma = ti.SMA;
//console.log ("SMA : "+lsma.calculate({period : 5, values : [6,2,3,4,5], reversedInput : true}));
//Coppock curve 10.14.11
// ADX 14 14
// OBV
// SAR 0.02 0.02 0.2

async function init(Sistema){
    //sql.conecta();
    //mySMA = new SMA({nom : SMA,periodes : 10,pes : 1});
    //dataIniciSimulacio = new Date('2018-05-05');
    //dataFinalSimulacio = new Date('2018-05-07');
    dataIniciSimulacio = new Date('2018-01-01');
    dataFinalSimulacio = new Date('2018-12-31');

    myBitlletera = new Bitlletera('GDAX','BTC','EUR',0,1000,0.003,0,dataIniciSimulacio);
    //mySimula = new Simula('GDAX','BTC-EUR',dataIniciSimulacio,dataFinalSimulacio,60,myBitlletera,Sistema);
    mySimula = new Simula('GDAX','BTC-EUR',dataIniciSimulacio,dataFinalSimulacio,3600*4,myBitlletera,Sistema);
    //myBitlletera.mostraResultats();
}

const { SistemaMitges } = require('./Sistemes.js');
//const sistema = sistemes.SistemaMitges;
//init(SistemaMitges);
const llistaSistemes = {SistemaMitges} 

const { WsServer } = require('./new/WsServer.js');

const fs = require('fs');

const path = require('path');

const {promisify} = require('util');

class Afs{
    constructor(nomFitxer){
        this.readFileAsync = promisify(fs.readFile);
        this.writeFileAsync = promisify(fs.writeFile);
        
        this.nomFitxer = nomFitxer;
        console.log('path resolve : '+ path.resolve(nomFitxer));
    }
    rf(){
        var data;
        try{
            //data = await this.readFileAsync(this.nomFitxer);
            data = JSON.parse(fs.readFileSync(this.nomFitxer));
            return data;
        } catch (e) {console.log('Error en lectura asincrona de fichero '+this.nomFitxer+' : '+e)}
        
    }
    wf(data){
        try{
            fs.writeFileSync(this.nomFitxer,JSON.stringify(data));
            return;
        } catch (e){
            console.log('Error en escritura asincrona '+this.nomFitxer+' : '+e);
        }
    }
    exists(){
        //return (fs.Stats.isDStats.is(this.nomfitxer));
        return (fs.existsSync(this.nomFitxer));
       /* try {
            return (fs.existsSync(this.nomFitxer));
        
        }
        catch (e){
            console.log('excepcion exixtencia fichero : '+e);
        }*/
    }
}

class Servidor extends WsServer{
    constructor(){
        super();
        this.Sistemes = [SistemaMitges];
        this.afs = new Afs('d:/projectes/trader-server/sistemes.json');
        var auxLLista=this.Sistemes.map((valor)=>{return valor.info()}) ;
        var novaLLista=[];
        console.log(this.afs.exists());
        if (!this.afs.exists()) this.afs.wf(auxLLista);
        else{
            novaLLista = this.afs.rf();
            if (typeof novaLLista != 'undefined' && novaLLista != null && 
            novaLLista.length != null && novaLLista.length > 0 && novaLLista[0] != null) {
                console.log('novallista null ? : '+ novaLLista != 'undefined');
                console.log('novallista null ? : '+ novaLLista != null);
                console.log('novallista null ? : '+ novaLLista.length != null);
                console.log('novallista null ? : '+ novaLLista.length > 0);
                console.log('length : '+novaLLista.length);
                console.log('novaLLista : '+novaLLista[0]);
                var trovat = false;
                var actualitza = false;
                auxLLista.forEach((element)=>{
                    trovat = false;
                    novaLLista.forEach((element2)=>{
                    if (element.classe == element2.classe) {
                        trovat = true;
                    }
                    });
                if (!trovat) {
                    novaLLista.push(element);
                    actualitza = true;
                }
                });
                if (actualitza) this.afs.wf(novaLLista);
            }
            else // el fitxer existeix pero es vuid
            {
                novaLLista = auxLLista;
                this.afs.wf(novaLLista);
            }

        } 
       
    }
    receive(data,ws){
        if (super.receive(data,ws)){
            var sdata = JSON.parse(data);
            switch (sdata.tipus){
                case 'info' : 
                    //var llistaSistemes = this.Sistemes.map((valor)=>{return valor.info()});
                    //console.log('llistaSistemes 1 : '+JSON.stringify(llistaSistemes));
                    //llistaSistemes = llistaSistemes.concat(this.afs.rf('/.sistemes.json'));
                    //console.log('llistaSistemes 2 : '+JSON.stringify(llistaSistemes));
                    this.enviaInfo(ws);
                    break;
                
                case 'guarda' :
                    this.gravaSistema(sdata.nom,sdata.sistema,ws);
                    break;

                case 'elimina':
                    this.eliminaSistema(sdata.nom,ws);
                    break;
                
                case 'simula' :
                    //init(SistemaMitges);
                    this.simulaSistema(sdata,ws);
                    break;
                
                default:
                    console.log('missatge tipus '+data.tipus+' no tractat');
                    console.log(JSON.stringify(data));
            }
        }
    }

    enviaInfo(ws){
        var packet = {};
                    packet.tipus = 'info';
                    packet.data =this.afs.rf(); 
                    //console.log(' a enviar : '+JSON.stringify(packet));
                    //ws.send({'type': 'info','data': JSON.stringify(llistaSistemes)});
                    ws.send(JSON.stringify(packet));
    }

    gravaSistema(nom,sistema,ws){
        // si el nom ja hi es , fem update , sino afegim nou

        var llista = this.afs.rf();
        var trovat = false;
        llista = llista.map((value)=>{
            if (value.nom == nom) {
                trovat = true;
                return sistema;
            }
            else return value;
        });
        if (!trovat){
            sistema.nom = nom;
            llista.push(sistema);
        }
        this.afs.wf(llista);
        this.enviaInfo(ws);
    }

    eliminaSistema(nom,ws){
        var llista = this.afs.rf();
        var _index = -1;
        llista.forEach((valor,index)=>{if (valor.nom == nom) _index = index});
        if (_index >= 0 ) {
            delete llista[_index];
            this.afs.wf(llista);
            this.enviaInfo(ws);
        }
        else 
            console.log('error en eliminacion sistema, item no encontrado....');

    }
    simulaSistema(dades,ws){
        //console.log('simula sistema dades : '+JSON.stringify(dades));
        console.log('data inici : '+dades.dataInici);
        console.log('data fi : '+dades.dataFi);
        console.log('granularitat : '+dades.granularitat);
        new Simula('GDAX','BTC-EUR',dades.dataInici,dades.dataFi,dades.granularitat,dades.sistema,dades.saldoInicial,ws);
    }
}

const servidor = new Servidor();