/*const Gdax = require('gdax');
const sql = require('../sql.js');
const publicClient = new Gdax.PublicClient();
*/
//sql.conecta();
//getPairs();

class Sincronitza {
    constructor(trader){
        this.trader = trader;
    }

    async init(){
        console.log('executant sincronitza init ...');
        let parells = await this.trader.exchange.getPairs();
        console.log('parells : ',parells);
        await this.trader.sql.updatePairs(parells);
        let dbParells = await this.trader.sql.getPairs();
        console.log('dbPArells : ',dbParells);
        //let parells = await this.getGdaxPairs();
        this.trader.exchange.sincronitzaDB(dbParells);
    }

    
    
}


module.exports = {Sincronitza};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  /* exemple de us sleep : 
  async function demo() {
    console.log('Taking a break...');
    await sleep(2000);
    console.log('Two seconds later');
  }
  */

var objecte = {};

function sincro(){
    console.log("sincronitzant 1...");
}
objecte.sincro=function(){
    console.log("sincronitzant 2...");
}
function test(){
    console.log("aqui fara el test ...");
    dataInicial = new Date('2018-01-01T00:01:00.000Z');
    dataFinal   = new Date('2018-01-01T01:01:00.000Z');
    parametres = {};
    parametres.start = dataInicial;
    parametres.end = dataFinal;
    parametres.granularity = 300;
    publicClient.getProductHistoricRates('BTC-USD',parametres,tracta);
}



async function sincronitza(exchange,pair,dataInicial,dataFinal,ws){
    
    //dataInicial = new Date('2017-01-01T00:01:00.000Z');
    //dataFinal = new Date('2018-09-06');

    
        switch (exchange){
            case 'GDAX' : nouSincroGDAX(pair,dataInicial,dataFinal,ws);
            break;
            default:
            throw err;
        }
    
}

async function nouSincroGDAX(pair,dataInicial,dataFinal,ws){
    //let dataInicial = new Date('2017-01-01T00:01:00.000Z');
    //let dataFinal   = new Date();
   // return;
    let parametres = {};
    console.log(dataInicial);
    //let inici = dataInicial.getTime() ; 
    //let final =  dataFinal.getTime() ;
    /*let inici = await sql.getLastDate("GDAX",pair);
    inici*=1000;
    console.log('inici , dataInicial: '+inici+','+dataInicial);
    await sleep(5000);
    if (inici > dataInicial) inici +=60*1000; else inici = dataInicial;
    */
    let inici = dataInicial;
    let final = dataFinal;
    console.log('sincronitzant desde : '+new Date(inici)+' fins : '+new Date(final));
    let conta = 1;
    let anterior = inici;
    for (part = inici ;   part < final;){
        let data = [];
        parametres.start = new Date(part).toISOString();
        anterior = part;
        part +=60*300*1000; // 60 segons 1000000 microsegons 300 registres
        parametres.end = new Date(part).toISOString();
        parametres.granularity = 60;
        // mirem que no els tinguem ja
        /*console.log('parametres : inici, final '+parametres.start+','+parametres.end);
        let contador = await sql.getCountCandlesByDate("GDAX",pair,anterior/1000,part/1000);
        if (contador >= 300 ) continue;
        console.log('contador : '+contador);
        */
        try{
        data = await publicClient.getProductHistoricRates(pair,parametres);
        } catch (e ){
            console.error(e);
        }
        console.log('data : '+data);
        console.log("bucle : part final ->> "+ conta++ +' :: '+part+' : '+final+'pair : '+pair);
        let progres = Math.round(((part - inici)/(final - inici))*100);
        let paquet = {};
        console.log('progres : inici part final ->'+inici+','+part+','+final+' :: '+progres);
        paquet.tipus = "progres";paquet.valor = progres;
        ws.send(JSON.stringify(paquet));
        try {
            await sleep (500);
        } catch (e){
            console.log(e);
        }
        if (data.length==0) continue;
        let d = new Date(data[0][0]*1000);
        let df = new Date(data[data.length - 1][0]*1000);
        let d2 = Date.parse('2018-01-01T00:01:00.000Z');
        //console.log("data inicial demanada : " + dataInicial + " : " + dataInicial.getTime());
        console.log("Primera data retornada : " + d);
        console.log("Ultima data retornada : "+ df);
        console.log("registres retornats : "+ data.length);
        console.log(data);
        candle = {};
        for (var f = 0 ; f < data.length ; f++){
            candle.exchange='"GDAX"';
            candle.pair='"'+pair+'"';
            candle.dateunix = data[f][0];
            candle.low = data[f][1];
            candle.high = data[f][2];
            candle.open = data[f][3];
            candle.close = data[f][4];
            candle.volume = data[f][5];
            console.log('abans insert candle : '+JSON.stringify(candle));
            sql.insertCandle(candle);
        }
    }
}






    

async function test3(){
    return 'retorn real ara : '+Date();
}
/*async function test4(){
    await sleep(3000);
    console.log('retorn diferit desde test04 : '+Date());
    return 'retorn diferit via return : '+Date();
}*/
async function test4(){
    console.log('test05 : inici '+Date());
    await sleep (3000);
    console.log('test05 : la execucio no acaba fins al cap de 3 segons : '+Date());

}
/*objecte.test = test;
objecte.test2 = test2;
objecte.test3 = test3;
objecte.test4 = test4;
*/
async function getPairs(){
    var res;
    var aux;

    // gdax
    //publicClient.getProducts(getGdaxPairs);
    aux = await(publicClient.getProducts());
    //console.log('aux : '+JSON.stringify(aux));
    
    // kraken
    // directe axios : https://api.kraken.com/0/public/AssetPairs
    // binance

}

/*function getGdaxPairs(error,response,data){
    //console.log('error : '+error);
    //console.log('response : '+JSON.stringify(response));
    console.log('data : '+JSON.stringify(data));
} */






//module.exports = objecte;

// normalitza BD , en concret, GDAX-BTC-EUR
// informem de la ultima candle
// informem i esborrem duplicats
// informem forats
async function eli(){
console.log('buscant duplicats ...');
console.log('trovats i eliminats : '+await sql.eliminaDups('GDAX','BTC-EUR')+' valors');
}

//eli();
async function _forats(){
    let forats = await sql.buscaForats('GDAX','BTC-EUR');
    console.log ('forats trobats : '+forats.length);
    console.log('tapant ...');
    for (let f = 0 ; f < forats.length ; f++){
        let fini = new Date((forats[f].ini + 1)*1000);
        let ffi = new Date((forats[f].fi-1)*1000);
        auxSincroGDAX('BTC-EUR',fini,ffi);
        console.log('tapant '+fini+' : '+ffi);
        await sleep(1000);
    };
    console.log('Fi tapat : '+forats.length);
}

//_forats();