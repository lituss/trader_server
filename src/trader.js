
const Gdax = require('gdax');
const publicClient = new Gdax.PublicClient();
const fs = require('file-system');

// 2014-11-06T10:34:47.123456Z

let initDate="2018-01-01T00:00:00Z";
let endDate= "2018-12-31T23:59:59Z";
aux = new Date(initDate);
aux2 = new Date(endDate);
console.log(aux);
console.log(aux.getTime());
console.log(aux2.getTime());

let initDate2 = aux.getTime();
let endDate2 = aux2.getTime();
//let parametres = "{ start: "+initDate2+",end: "+endDate2+",granularity: 60}";
let parametres3 = "[{ start: "+initDate+"},{end: "+endDate+"},{granularity: 60}]";
parametres={};
parametres.start = initDate;
parametres.end = endDate;
parametres.granularity = 60;
parametres2 = JSON.stringify(parametres);
console.log("parametres : " + parametres2);
//return;

const candles = publicClient.getProductHistoricRates('BTC-EUR',parametres3,(error,response,data) =>{
    if (error){
        console.log("Error : "+error);
    }
    else{
        processa(data);
        //espelmes = JSON.parse(data);
        //console.log(espelmes);
        //console.log(data);
    }
});

function processa(data){
    flen = data.length;
    i = 0;
    for (i = 0 ; i < flen ; i++){
        candle = data[i];
        console.log('\n');
        for (j = 0 ; j < candle.length ; j++){
            if ( j == 0){console.log(Date(candle[0]))}
            else{
            console.log(candle[j]);
            }
        }
        
    }
    console.log("total registres : "+i);
}