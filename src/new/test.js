let Gdax = require('coinbase-pro');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


let publicClient = new Gdax.PublicClient();
    
async function crida(){ 
    let parells = await publicClient.getProducts();
    console.log('parells : ',parells);
}


async function sincroGDAX2(){
    let dataInicial = new Date('2018-01-01T00:01:00.000Z');
    let dataFinal   = new Date();
    let pair = 'BTC-EUR';
   // return;
    let parametres = {};
    console.log(dataInicial);
    let inici = dataInicial.getTime() ; 
    let final =  dataFinal.getTime() ;
    let conta = 1;
    let data = null;
    let part;
    for (part = inici ;   part < final;){
        parametres.start = new Date(part);//.toISOString();
        part +=60*1000*300; // 60 segons 1000000 microsegons 300 registres
        parametres.end = new Date(part - 1);//.toISOString();
        parametres.granularity = 60;
        try{
            console.log('parametres : ',parametres);
            data = await publicClient.getProductHistoricRates(pair,parametres);
        }catch (e) {
            throw e
        };
        
       /*publicClient.getProductHistoricRates(pair,parametres).then((ldata)=>{
           console.log(ldata);
           console.log('lon : '+ldata.length);
       })*/
        //console.log("bucle : part final ->> "+ conta++ +' :: '+part+' : '+final);
        console.log('inici fi : '+parametres.start+' :: '+parametres.end);
        console.log('inici fi : '+parametres.start.getTime()+' :: '+parametres.end.getTime());
        console.log(data[0]);
        console.log(data[data.length - 1]);

        console.log('lon : '+data.length);
        //data = data.filter(d=>d[0] >= inici / 1000 && d[0]<=final/1000);
        /*if (data.length > 0) {
            //insertaVelas(data);
            await sleep (1000);
        }*/
        await sleep (334);
    }
}





sincroGDAX();