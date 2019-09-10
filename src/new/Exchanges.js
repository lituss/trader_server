let Gdax = require('coinbase-pro');
let fs = require('file-system');
let publicClient = new Gdax.PublicClient();

function sleep(ms) {
    console.log('executant wait de : ' +ms)
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  

class Exchange {
    constructor(trader){
        this.trader = trader;
        this.gdax = new GDAX(trader);
    }
    async getPairs(){
        let parells = await this.gdax.getGdaxPairs();
        return parells;
    }

    

    async sincronitzaDB(parells){
            for (let f = 0 ; f < parells.length ; f++){
                let pair = parells[f];
                switch (pair.exchange){
                case 'GDAX' :
                    pair.dateInit = await this.gdax.ajustaDataInicial(pair.pair,pair.dateInit,pair.dateEnd);  
                    await this.gdax.sincroGDAX(pair.pair,pair.dateInit,pair.dateEnd);
                //case 'GDAX' : await this.gdax.sincroGDAX2(pair.pair);
                break;
                default:
                    console.log(pair.exchange+' Pendiente de implementacion ...');
                    throw err;
                }
            }
        }
}

class GDAX  {
    constructor(trader){
        this.trader = trader;
        
    }
    async getGdaxPairs(){
        var retorn = [];
        var auxRegistre = {};
        var aux = await(publicClient.getProducts());
        var value;
        
        for (var f = 0 ; f < aux.length; f++)
            {
                value = aux[f];
                if (value.quote_currency==='EUR'){
                    console.log(value.id);
                    auxRegistre={};
                    auxRegistre.exchange = 'GDAX';
                    auxRegistre.pair = value.id;
                    //auxRegistre.base = value.base_currency;
                    //auxRegistre.display = value.display_name;
                    retorn.push(auxRegistre);
                }
        };
    
    console.log(retorn);
    return retorn;
    } 

    async ajustaDataInicial(pair,dataInicial,dataFinal){
        // ajustem la data inicial perque molts mercats no tenen dades tan antigues
        // perque no cotitzaben en el exchange i evitem la espera carregant paquets vuits
        
        let parametres = {};
        console.log(dataInicial);
        let inici = dataInicial.getTime() ; 
        let final =  dataFinal.getTime() ;
        let anterior = inici;
        let marge = final - inici;
        let primer = true;
        let part =60*1000*300; // 60 segons 1000000 microsegons 300 registres
        while(true){
            await sleep(666);
            parametres.start = new Date(inici);//.toISOString();
            
            parametres.end = new Date(inici + part - 1);//.toISOString();
            parametres.granularity = 60;
            let data;
            try{
                console.log('parametres ajusta data : ',parametres,'now : ',new Date());
                data = await publicClient.getProductHistoricRates(pair,parametres);
            }catch (e) {
                throw e
            };
            if (data.length > 0)
                if (primer) return new Date(parametres.start);
                else if (marge < 6000000) return new Date(inici - marge);
            primer = false;
            marge = Math.round(marge / 2);
            if (data.length > 0) inici-=marge;else inici+=marge;
        }
    }

    async sincroGDAX(pair,dataInicial,dataFinal){
        //let dataInicial = new Date('2018-01-01T00:01:00.000Z');
        //let dataFinal   = new Date();
        //let pair = 'BTC-EUR';
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
                console.log('parametres : ',parametres,'Parell : '+pair);
                data = await publicClient.getProductHistoricRates(pair,parametres);
            }catch (e) {
                console.log(e);
                parametres.exchange="GDAX";
                parametres.pair=pair;
                fs.appendFileSync('./errores_carga_velas.json',JSON.stringify(parametres));
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
            if (data.length > 0) {
                await this.insertaVelas(pair,data);
             //   await sleep (1000);
            }
            await sleep (666);
        }
    }
    
    async insertaVelas(pair,data){
        
            let d = new Date(data[0][0]*1000);
            let df = new Date(data[data.length - 1][0]*1000);
            let d2 = Date.parse('2018-01-01T00:01:00.000Z');
            //console.log("data inicial demanada : " + dataInicial + " : " + dataInicial.getTime());
            console.log("Primera data retornada : " + d);
            console.log("Ultima data retornada : "+ df);
            console.log("registres retornats : "+ data.length);
            //console.log(data);
            let candle = {};
            for (let f = 0 ; f < data.length ; f++){
                candle.exchange="GDAX";
                candle.pair=pair;
                candle.dateunix = data[f][0];
                candle.low = data[f][1];
                candle.high = data[f][2];
                candle.open = data[f][3];
                candle.close = data[f][4];
                candle.volume = data[f][5];
                //console.log(candle);
                try{
                await this.trader.sql.insertCandle(candle);
                } catch (e) {throw e;}
            }
        
    }

}

module.exports = {Exchange}