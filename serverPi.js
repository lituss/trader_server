const fs = require ('fs');
const path = require('path');
const { SistemaMitges } = require('./Sistemes.js');
const llistaSistemes = {SistemaMitges};
const {_Bitlletera,NewMayor} = require('./contab.js');
const { WsServer } = require('./WsServer.js');
//const {Sfs} = require ('./Sfs.js');

//import { getHeapSpaceStatistics } from "v8";
//import { runInNewContext } from "vm";



class Exchange{
    async inicia(){
        
        this.parells = await this.getParells();
        let milis = this.granularity*1000/this.parells.length;
        if (milis < this.limit) throw new Error('Granularitat massa curta per '+this.parells.length+' parells');
        milis = Math.trunc(milis);
        let inc = milis;
        for (var f = 0 ; f < this.parells.length ; f++){
            //let milis = (f + 1)*this.limit;
            console.log('milis : '+milis);
            //setTimeout(this.crearPar,milis+=5000,this.parells[f],trader.sistema,this);
            setTimeout(this.crearPar,milis,this.parells[f],this.trader.sistema,this);
            milis+=inc;
        }
            
            /*p.sistema = creaSistema(sistema);
            p.candles = this.getData(p);
            p.resultat = p.calcula();
            if (p.resultat === 1) this.compra(p,100);
            else if (p.resultat === -1) this.ven(p);
        });*/
    }

    crearPar(p,sistema,refExchange){
        refExchange.Oparells.push(new Par(p,sistema,refExchange));
    }

    codificaCandles(localCandles){
        return (localCandles.map((d)=>{
            let p = {};
            p.dateunix = d[0];
            p.low = d[1];p.high = d[2];p.open=d[3];
            p.close=d[4];p.volume=d[5];
            return p;
        }).filter(d=>d.volume > 0).sort((a,b)=>(a.dateunix - b.dateunix))).map(d=>{
            d.dateunix = new Date(d.dateunix*1000);
            return d;});
    }
    unificaCandles(localCandles){
        if (localCandles.length == 0) {
            return null;
        }
        else {
            let low = Infinity;
            let high = -Infinity;
            let open = localCandles[0].open;
            let close = localCandles[localCandles.length - 1].close;
            let volume = 0;
            let dateunix = localCandles[localCandles.length - 1].dateunix;
            localCandles.forEach(c=>{
                if (c.low < low) low = c.low;
                if (c.high > high) high = c.high;
                volume+=c.volume;
            });
            return ({'dateunix': dateunix,'low': low,'high': high,'open': open,'close':close,'volume': volume});
        }
    }
  
}
//[{"nom":"3EMAS","classe":"SistemaMitges","indicadors":[{"nom":"Ema_curta","pes":1,"parametres":[{"nom":"Periodes","valor":"10"}]},{"nom":"Ema_mitja","pes":1,"parametres":[{"nom":"Periodes","valor":"20"}]},{"nom":"Ema_llarga","pes":1,"parametres":[{"nom":"Periodes","valor":"50"}]}]}]
const Gdax = require('gdax');
const publicClient = new Gdax.PublicClient();
const axios = require('axios');

class GDAX extends Exchange{
    constructor(trader,takerFee,makerFee){
        super();
        this.trader = trader;
        this.takerFee = takerFee;
        this.makerFee = makerFee;
        this.nom = 'GDAX';
        this.bitlleteres = [];
        this.Oparells = [];
        this.monedaReferent = 'EUR';
        this.limit = 1000; //ms
        this.limitTimingParells = 5000;
        this.saldoInicialSimulat = 1000;
        this.granularity = this.trader.granularity;
        this.major = this.trader.major;
        this.valorCompres = 100; //  100 € per compres a gdax
        this.last = {};
        this.inicia();    
        
    }

    

    async getParells(){
        let products = [];
        try{
            products = await publicClient.getProducts(); 
            //console.log(JSON.stringify(products));
        } catch (error){console.error(error);}
        //console.log(JSON.stringify(products));
        let reals = products.map(d=>{return({'id': d.id,'base': d.base_currency,'referent': d.quote_currency,'display': d.display_name})});
        reals = reals.filter(d=>d.referent=='EUR');
        reals.forEach(d=>console.log(JSON.stringify(d)));
        return reals;
    }
        //reals.forEach
    async getCandles(id){
        try{
            var localCandles = await publicClient.getProductHistoricRates(
                id,
                { 'granularity': this.granularity },
                );
            
            //console.log(JSON.stringify(candles));
            //console.log('lon : '+candles.length);
            //candles.forEach(d=>{
            //    console.log('fechas : '+d[0]+' - '+new Date(d[0]*1000));
           // });
           if (localCandles.length > 0){
            this.last[id] = (Math.max.apply(null,localCandles.map(d=>d[0])))*1000;
           }
           else {
               this.last[id] = Date.parse(Date());
           }
           let candles = this.codificaCandles(localCandles);
           return candles;
        } catch (error){console.error(error)}
    }
    
    

    async next(id,date){
        ////
        //if (id != 'BTC-EUR') return[];
        ////
            //let nDate = Date.parse(date)/1000;
            let dateIni = (new Date(this.last[id] + 1000)).toISOString();
            let data = [];
            let parametres= null;
            while (true){
                let dateFi = new Date().toISOString();
                console.log('interval : '+dateIni+ ' '+dateFi);
                parametres = {'start': dateIni,'end': dateFi,'granularity': this.granularity};
                try{
                    //data = await axios.get(`https://api.pro.coinbase.com//products/${id}/candles?start=${dateIni}&end=${dateFi}&granularity=${this.granularity}`);
                    //data = data.data;
                    data = await publicClient.getProductHistoricRates(id,parametres);
                    if (data.length > 0){
                        console.log('total velas : '+data.length+' fechaini : '+data[0][0]+' fechafin : '+data[data.length - 1][0]);
                        var di = new Date (data[0][0]*1000).toISOString(); 
                        var df = new Date (data[data.length - 1][0]*1000).toISOString();
                        console.log (di+' : '+df);
                        this.last[id] = (Math.max.apply(null,data.map(d=>d[0])))*1000;
                    }
                } catch (e){
                    console.error(e);
                    await sleep(this.limit);
                    data = [];
                    continue;
                }
                finally {
                    if (data.length > 0){
                        console.log('gdax-next-'+id+' total : '+data.length);
                        data = this.codificaCandles(data.filter(d=>d[0] > (Date.parse(dateIni)/1000)));//firtro para corregir bug del ws de gdax que manda las velas desde la fecha que leda la gana
                        console.log('gdax-next-'+id+' bones : '+data.length);
                        data = [this.unificaCandles(data)];
                    }
                return data;
                }
            }
            
    }
    
    
}
kraken_api = require('kraken-api');
const kraken_key          = '...'; // API Key
const kraken_secret       = '...'; // API Private Key
const kraken       = new kraken_api(kraken_key, kraken_secret);

class Kraken extends Exchange{
    constructor(trader,takerFee,makerFee){
        super();
        this.trader = trader;
        this.takerFee = takerFee;
        this.makerFee = makerFee;
        this.nom = 'Kraken';
        this.bitlleteres = [];
        this.Oparells = [];
        this.monedaReferent = 'USD';
        this.limit = 3000; //ms
        this.limitTimingParells = 5000;
        this.saldoInicialSimulat = 1000;
        this.granularity = this.trader.granularity; // inicialment ho deixemen segons per els calculs de concurrencia que son generics per tots els exchanges
        this.major = this.trader.major;
        this.valorCompres = 100; //  100 $ per compres a kraken
        this.inicia();    
        this.KrakenGranularity = Math.round(this.trader.granularity/60); // a kraken la granularity es en minuts
        
    }

    

    async getParells(){
        let products = [];
        try{
            products = await kraken.api('AssetPairs');
            console.log('getParells : '+Date()) 
            //console.log(JSON.stringify(products));
        } catch (error){console.error(error);}
        //console.log(JSON.stringify(products));
        //console.log('kraken pairs : '+JSON.stringify(products));
        let reals = [];
        for (var auxPar in products.result){
            let auxId = auxPar;
            let base = products.result[auxId].base;
            let referent = products.result[auxId].quote;
            let display = products.result[auxId].wsname;
            if (!display) continue;
            reals.push({'id': auxId,'base': base,'referent': referent,'display': display});
        }
        
        //let reals = products.map(d=>{return({'id': d.id,'base': d.base_currency,'referent': d.quote_currency,'display': d.display_name})});
        reals = reals.filter(d=>d.referent=='ZUSD');
        //reals.forEach(d=>console.log(JSON.stringify(d)));
        console.log('totals parells : '+reals.length);
        this.last = {};
        return reals;
    }
        //reals.forEach
    async getCandles(id){
        while (true){
            await sleep(this.limit);
            let localCandles = [];
            try{
                localCandles = await kraken.api('OHLC',{'pair': id,'interval': this.KrakenGranularity, 'since': 0});
            } catch (error){
                console.error('Error en getCandles catch : '+error);
                continue;
            }
            console.log('getCandles : '+Date());
            if (localCandles.error.length > 0) {
                console.error('Error getCandles : '+JSON.stringify(localCandles.error));
                continue;
            }
            
            //console.log(JSON.stringify(candles));
            //console.log('lon : '+candles.length);
            //candles.forEach(d=>{
            //    console.log('fechas : '+d[0]+' - '+new Date(d[0]*1000));
           // });
           //console.log('kraken candles : '+JSON.stringify(localCandles));
           //for (var aux in localCandles.result)
           this.last[id] = localCandles.result.last;
           return this.codificaCandles(localCandles,id);
        } 
    }
    
    codificaCandles(localCandles,id){
        let candles = [];
        candles = localCandles.result[id].map((d)=>{
            let p = {};
            p.dateunix = Number(d[0]);
            p.low = Number(d[3]);
            p.high =Number(d[2]);p.open=Number(d[1]);p.close=Number(d[4]);
            p.volume = Number(d[6]);
            return (p);
           });
        candles = candles.sort((a,b)=>(a.dateunix - b.dateunix));
        candles = candles.map(d=>{
            d.dateunix = new Date(d.dateunix*1000);
            return d;}); 
           //let candles = this.codificaCandles(localCandles);
        //console.log('kraken candles : '+JSON.stringify(candles));
        return candles.filter(d=> d.volume > 0);
    }

    async next(id,date){
     
            //let dateIni = new Date(Date.parse(date) + 1).toISOString();
            //let dateFi = new Date().toISOString();
            //let parametres = {'start': dateIni,'end': dateFi,'granularity': this.granularity};
        
            //let data = await publicClient.getProductHistoricRates(id,parametres);
            console.log('crida a next ....');
            
            let surt = false;
            while(true){
                await sleep(this.limit);
                let localCandles = [];
                try{
                    localCandles = await kraken.api('OHLC',{'pair': id,'interval': this.krakenGranularity, 'since': this.last[id]});
                } catch(error){
                    console.log('error next capturat : '+error);
                    continue;
                }
                if (localCandles.error.length > 0 ){
                    console.error('Error en next : '+JSON.stringify(localCandles.error));
                    continue;
                }
                if (localCandles.length == 0) return [];        
                let data = this.codificaCandles(localCandles,id);
                this.last[id] = localCandles.result.last;
                data = [this.unificaCandles(data)];
                return data;
            }
            
    }
}
//const axios = require('axios');

class binance extends Exchange{
    constructor(trader,takerFee,makerFee){
        super();
        this.trader = trader;
        this.takerFee = takerFee;
        this.makerFee = makerFee;
        this.nom = 'binance';
        this.bitlleteres = [];
        this.Oparells = [];
        this.monedaReferent = 'BTC';
        this.limit = 1000/20; //ms
        this.limitTimingParells = 5000;
        this.saldoInicialSimulat = 0.25;
        this.granularity = this.trader.granularity;
        this.granularityBinance = Math.round(this.granularity/60) + 'm'; 
        this.major = this.trader.major;
        this.valorCompres = 0.025; //  100 $ per compres a kraken
        console.log('granularityBinance : '+this.granularityBinance);
        this.inicia();    
        
    }

    

    async getParells(){
        let products = [];
        try{
            products = await axios.get('https://api.binance.com/api/v1/exchangeInfo');
            console.log('getParells : '+Date()) 
            //console.log(JSON.stringify(products));
        } catch (error){
            console.error('Error en getParells : '+error);
        }
        //console.log(JSON.stringify(products));
        //console.log('kraken pairs : '+JSON.stringify(products));
        let reals = [];
        products.data.symbols.forEach(auxPar=>{
            let auxId = auxPar.symbol;
            let base = auxPar.baseAsset;
            let referent = auxPar.quoteAsset;
            let display = auxId;
            if (auxPar.status == 'TRADING') reals.push({'id': auxId,'base': base,'referent': referent,'display': display});
        });
        
        //let reals = products.map(d=>{return({'id': d.id,'base': d.base_currency,'referent': d.quote_currency,'display': d.display_name})});
        reals = reals.filter(d=>d.referent=='BTC');
        reals.forEach(d=>console.log(JSON.stringify(d)));
        console.log('totals parells : '+reals.length);
        this.last = {};
        return reals;
    }
        //reals.forEach
    async getCandles(id){
        while (true){
            await sleep(this.limit);
            let localCandles = [];
            try{
                //localCandles = await kraken.api('OHLC',{'pair': id,'interval': 1, 'since': 0});
                localCandles = await axios.get(`https://api.binance.com/api/v1/klines?symbol=${id}&interval=${this.granularityBinance}`);
            } catch (error){
                console.error('Error en getCandles catch : '+error);
                continue;
            }
            //console.log('getCandles time : '+Date.now());
            
            
            
            //console.log(JSON.stringify(candles));
            //console.log('lon : '+candles.length);
            //candles.forEach(d=>{
            //    console.log('fechas : '+d[0]+' - '+new Date(d[0]*1000));
           // });
           //console.log('kraken candles : '+JSON.stringify(localCandles));
           //for (var aux in localCandles.result)
           this.last[id] = Math.max.apply(null,localCandles.data.map(d=>d[6]));
           
           return this.codificaCandles(localCandles.data,id);
        } 
    }
    
    codificaCandles(localCandles,id){
        let candles = [];
        candles = localCandles.map((d)=>{
            let p = {};
            p.dateunix = Number(d[0]);
            p.low = Number(d[3]);
            p.high =Number(d[2]);p.open=Number(d[1]);p.close=Number(d[4]);
            p.volume = Number(d[5]);
            return (p);
           });
        candles = candles.sort((a,b)=>(a.dateunix - b.dateunix));
        candles = candles.map(d=>{
            d.dateunix = new Date(d.dateunix);
            return d;}); 
           //let candles = this.codificaCandles(localCandles);
        //console.log('kraken candles : '+JSON.stringify(candles));
        
        return candles.filter(d=>d.volume > 0);
    }

    async next(id,date){
     
            //let dateIni = new Date(Date.parse(date) + 1).toISOString();
            //let dateFi = new Date().toISOString();
            //let parametres = {'start': dateIni,'end': dateFi,'granularity': this.granularity};
        
            //let data = await publicClient.getProductHistoricRates(id,parametres);
            //console.log('crida a next ....'+Date.now());
            
            let surt = false;
            while(true){
                await sleep(this.limit);
                let localCandles = [];
                try{
                    //localCandles = await kraken.api('OHLC',{'pair': id,'interval': 1, 'since': this.last[id]});
                    let init = this.last[id] + 1;
                    let fi = Date.parse(Date());
                    localCandles = await axios.get(`https://api.binance.com/api/v1/klines?symbol=${id}&interval=${this.granularityBinance}&startTime=${init}&endTime=${fi}`);
                } catch(error){
                    console.log('error next capturat : '+error);
                    continue;
                }
                console.log('next , par contador abans: '+id+' '+this.last[id]);   
                console.log(' array : '+JSON.stringify(localCandles.data.map(d=>d[6])));     
                if (localCandles.data.length > 0) {
                    this.last[id] = Math.max.apply(null,localCandles.data.map(d=>d[6]));
                }
                else{ 
                    return [];
                }
                console.log('next , par contador despres: '+id+' '+this.last[id]);
                let data = this.codificaCandles(localCandles.data,id);
                
                data = [this.unificaCandles(data)];
                return data;
            }
            
    }
}



class Par{
    constructor(par,sistema,exchange){
        console.log('crea Par amb par,sistema,exchange : '+par.id+' , '+sistema.nom+' , '+exchange.nom);
        //this.fileCandles = new Sfs(par.id+'.can.txt','candle',exchange.trader.socket,['candles']);
        this.inicia(par,sistema,exchange);
    }

    async inicia(par,sistema,exchange){
        this.par = par;
        this.exchange = exchange;
        if (!exchange.bitlleteres.some((b)=>b.moneda == par.base)) exchange.bitlleteres.push({'moneda': par.base,'bitlletera': new _Bitlletera(exchange,par.base,0,exchange.trader.socket)});
        if (!exchange.bitlleteres.some((b)=>b.moneda == par.referent)) exchange.bitlleteres.push({'moneda': par.referent,'bitlletera': new _Bitlletera(exchange,par.referent,exchange.saldoInicialSimulat,exchange.trader.socket)});
        try{
            this.candles = await exchange.getCandles(par.id);
               //[{"nom":"3EMAS","classe":"SistemaMitges","actiu":1,"indicadors":[{"nom":"Ema_curta","pes":1,"parametres":[{"nom":"Periodes","valor":"10"}]},{"nom":"Ema_mitja","pes":1,"parametres":[{"nom":"Periodes","valor":"20"}]},{"nom":"Ema_llarga","pes":1,"parametres":[{"nom":"Periodes","valor":"50"}]}]}]
            console.log('candles : '+par.id+' : '+this.candles.length);
            //this.fileCandles.wf(this.candles);
            this.sistema = new llistaSistemes[sistema.classe](this.candles,sistema);
            var that = this;
            // enviem resultats al client
            let paquet = {};
            paquet.par = par;
            paquet.exchange = exchange.nom;
            paquet.canals = ['candles2'];
            paquet.dades = this.sistema.getAll();
            exchange.trader.socket.send(JSON.stringify(paquet));
            console.log('Interval next : ara , inc :: '+Date.parse(new Date()) + ' , '+exchange.granularity*1000);
            console.log('ultima candle : '+JSON.stringify(this.candles[this.candles.length - 1]));
            setInterval(that.next,exchange.granularity*1000,that);
            //setInterval(that.next,60000,that);
        }catch (e){console.error(e);}
    }
    enviaNousClients(that){
        let paquet = {};
        paquet.par = that.par;
        paquet.exchange = that.exchange.nom;
        paquet.canals = ['candles2'];
        paquet.dades = that.sistema.getAll();
        that.exchange.trader.socket.send(JSON.stringify(paquet));
    }

   async next(that){
       //console.log('entra a next ...');
       let fecha = null;
       try{
        fecha = new Date(Math.max.apply(null,that.candles.map(d=>Date.parse(d.dateunix)))).toISOString();
       }catch(e){
           console.log(e);
       }
       let newCandles = [];
       try{
            newCandles = await that.exchange.next(that.par.id,fecha);
            
            if (newCandles.length == 0) return;
            if (newCandles[0] == null) return;
                //console.log('newCandles null');
            if (newCandles[0].close == null)
                console.log('newCandles.close null ');

            console.log('Next : '+that.par.id+' - '+newCandles.length);
            newCandles.forEach((d)=>{
                let detail = that.sistema.next(d);
                console.log('detall : '+JSON.stringify(detail));
                // enviem noves dades
                let paquet = {};
                paquet.par = that.par;
                paquet.exchange = that.exchange.nom;
                paquet.canals = ['candles2'];
                paquet.dades = {};
                paquet.dades.detail = [detail];
                that.exchange.trader.socket.send(JSON.stringify(paquet));

                let resultat = detail.resultat;
                if (resultat == 1 ) 
                    that.compra(d.close,that.exchange.valorCompres); // les compres son de 100€ per diversificar 
                else if (resultat == -1) 
                    that.ven(d.close);   // les vendes son totals
                that.candles.push(d);
            //that.fileCandles.af(d);
            });
        }catch(e){
            console.error(e);}
   }

    async compra(preu,_import){ // import amb referent (€,$ o BTC)
        try{
            
        let bitlletera = this.exchange.bitlleteres.find((d)=>d.moneda==this.par.referent).bitlletera;
        
           // console.log('bitlleteres -> '+JSON.stringify(d));
           // return d.moneda == this.par.referent;
        //});
        let valorCompra = bitlletera.get(_import);
        
        if (valorCompra){
            let valorCompraReal = valorCompra*(1 - this.exchange.takerFee/100);
            let real = this.exchange.bitlleteres.find(d=>d.moneda == this.par.base).bitlletera.put(valorCompra/preu);
            this.exchange.trader.mayor.apunta(new Date(),this.exchange.nom,this.par.base,this.par.referent,real,-valorCompraReal,preu)
        }
    }
    catch (e) {
        console.error(e+' : '+this.par.referent);}
    }

    async ven(preu){
        let valorVenda = this.exchange.bitlleteres.find(d=>d.moneda == this.par.base).bitlletera.getAll();
        if (valorVenda){
            let valorVendaReal = valorVenda*(1 - this.exchange.takerFee/100);
            let real = this.exchange.bitlleteres.find(d=>d.moneda == this.par.referent).bitlletera.put(valorVendaReal*preu);
            this.exchange.trader.mayor.apunta(new Date(),this.exchange.nom,this.par.base,this.par.referent,-valorVendaReal,real,preu);
        }
    }
}
    


class cartera{
   // exchange,par, valor
}

class Trader{
   constructor(granularity,socket){
       this.socket = socket;
        this.inicia(granularity);    

   }
   async inicia(granularity){
       // cargar sistema
       // cargar mercados
       // cargar posiciones
       // hacer calculos iniciales
       // ejecutar ventas totales
       // ejecutar compras parciales
       // programar timer para ejecucion periodica
       this.mayor = new NewMayor();
       this.sistema = await this.cargarSistema();
       this.exchanges = [];
       this.granularity = granularity;
       //this.exchanges.push({'name': 'GDAX','exchange': new GDAX(this,0.3,0)});
       //this.exchanges.push({'name': 'Kraken','exchange':  new Kraken(this,0.26,0.16)});
       this.exchanges.push({'name': 'binance','exchange':  new binance(this,0.1,0.1)});
    
       
       let that = this;
       setInterval(that.mostraBalance,60000,that);

      // setInterval(this.next(),this.propSistema.sistema.granularity);
   }
   async cargarSistema(){
       //[{"nom":"3EMAS","classe":"SistemaMitges","actiu":1,"indicadors":[{"nom":"Ema_curta","pes":1,"parametres":[{"nom":"Periodes","valor":"10"}]},{"nom":"Ema_mitja","pes":1,"parametres":[{"nom":"Periodes","valor":"20"}]},{"nom":"Ema_llarga","pes":1,"parametres":[{"nom":"Periodes","valor":"50"}]}]}]
       let sistema="undefined";
       try{
           let sistemes = JSON.parse(fs.readFileSync(__dirname+'/sistemes.json'));
           sistema = sistemes.find(s=>{return s.actiu === 1});
           if (sistema=="undefined") throw "no encontrado sistema activo";
       } catch(e){
           console.log('Sistema no encontrado :(');
           process.exit();
       }
       return sistema;
   }
   next(){
       // cargar nuevos datos mercado
       // calculos
       // ventas totales
       // compras parciales
       this.exchanges.forEach(e=>{e.exchange.next()});

   }
   mostraBalance(that){
       console.log('Balanç ...');
       that.exchanges.forEach(d=>
        {
            d.exchange.bitlleteres.forEach(e=>e.bitlletera.show());
        })
   }
}
//const fs = require ('fs');


class Server extends WsServer{
    constructor(){
        super();
        //this.init();
        this.trader = new Trader(60,this);
    }
    //sleep(milis){
    //    return new Promise(resolve => setTimeout(resolve,milis));
    //}
    async init(){
        while (this.clients.length == 0){
            try{
                await this.sleep (1000);
            } catch (e){console.error('Error en sleep ...');}
        }
        await this.sleep (5000);
        this.trader = new Trader(60,this); // velas de 1 minuto
    }
    connection(ws){ // se ha conectado un nuevo socket, enviamos historial
        super.connection(ws);
        

    }
    receive(data,ws){
        let recepcio = super.receive(data,ws);
        if (recepcio.tracta == false) return;
        if (recepcio.hasOwnProperty('nousCanals')){
            let nousCanals = recepcio.nousCanals;
            nousCanals.forEach(canal=>{
                switch (canal){
                    case 'bitlleteres':
                        if (this.trader){
                            this.trader.exchanges.forEach(e=>{
                                e.exchange.bitlleteres.forEach(b=>{
                                    b.bitlletera.enviaHistorial();
                                    //console.log('aux : ' +JSON.stringify(aux));
                                    //for (var component in aux) {
                                    //    console.log('component : '+component);
                                    //    this.send(component);
                                    //}
                                });
                            });
                        }
                    break;

                    case 'candles2' :
                        /*if (this.trader){
                            this.trader.exchanges.forEach(e=>{
                                e.exchange.Oparells.forEach(p=>p.enviaNousClients(p));
                            })
                        }*/
                }
            })
        }
        else{
            data = JSON.parse(data);
            console.log('tipus nou ... : '+JSON.stringify(data));
            if (data.tipus == 'getDadesTrading'){
                console.log('cumpleix ...'); // 2019:1:24:21:57:58
                try{
                    let  aux = data.dataCentralComprimida;
                    let exchange_nom = data.exchange_nom.replace(/(\w+)-\w+/,'$1');
                    let exchange_par = data.exchange_nom.replace(/\w+-(\w+)/,'$1');
                    let exchange = this.trader.exchanges.find(d=>d.exchange.nom == exchange_nom);
                    let monedaReferent = exchange.exchange.monedaReferent;
                    exchange.exchange.Oparells.forEach(d=>console.log('parells : '+d.par.base));
                    let par = exchange.exchange.Oparells.find(d=>d.par.base == exchange_par );
                    let paquet = {};
                    if (aux){
                        let auxdata = aux.replace(/(\d{4}):(\d\d?):(\d\d?):(\d\d?):(\d\d?):(\d\d?)/,'$1-$2-$3T$3:$4:$5:$6');
                        let fecha = new Date();
                        fecha.setFullYear(aux.replace(/^(\d{4}).*/,'$1'),aux.replace(/^\d{4}:(\d\d?).*/,'$1') ,aux.replace(/^\d{4}:\d\d?:(\d\d?).*/,'$1'));
                        fecha.setHours(aux.replace(/\d{4}:\d\d?:\d\d?:(\d\d?):\d\d?:\d\d?/,'$1'));
                        fecha.setMinutes(aux.replace(/\d{4}:\d\d?:\d\d?:\d\d?:(\d\d?):\d\d?/,'$1'));
                        fecha.setSeconds(aux.replace(/\d{4}:\d\d?:\d\d?:\d\d?:\d\d?:(\d\d?)/,'$1'));
                        paquet = par.sistema.getAll(fecha);
                    }
                    else paquet = par.sistema.getAll();
                    paquet.titol = exchange_nom+' : '+exchange_par+' - '+monedaReferent;
                    ws.send(JSON.stringify({'tipus': 'resultats','data': paquet,'titol': par.nom}));
                }catch (e)  {console.error('Error en getDadesTrading : '+e)}
            }
        }
    }
}

function sleep(milis){
    return new Promise(resolve => setTimeout(resolve,milis));
}


new Server();


/*let inc = 10;
let milis = inc;
for (var f = 0 ; f < 10000 ; f++){
    //let milis = (f + 1)*this.limit;
    console.log('milis : '+milis);
    //setTimeout(this.crearPar,milis+=5000,this.parells[f],trader.sistema,this);
    setTimeout(prova,milis,f);
    milis+=inc;
}

function prova(f){
    console.log('element , time : '+f+' , '+Date.now());
}
*/
//console.log(new Date(1551614173516));

// proves GDAX websocket
/*
const Gdax = require('gdax');
const passphrase = 'y35lyqkobjm';
const secret = 'KL3mHGk47bFnTxvRAR7e1JOZ8hOTS2qSppjYK99yhMNazak287wQHKrD0eVABbsAjy+hsPkhUHTUApKmksHauQ==';
const apiKey = '32ed13e5d716f167311d4bab8902a017';
setTimeout({})
const websocket = new Gdax.WebsocketClient(['BTC-USD'],'wss://ws-feed.pro.coinbase.com',
{key: apiKey,secret: secret,passphrase: passphrase},
    {channels: ['ticker']});
 
websocket.on('message', data => {
  /* work with data 
  if (data.type==='ticker'){
      let dades={};
      dades.product_id = data.product_id;
      dades.price = data.price;
      dades.side =data.side;
      dades.time = data.time;
      dades.last_size = data.last_size;
      //console.log('data:'+JSON.stringify(dades));
      console.log('date : '+dades.time+' : '+dades.last_size )
  }
  //console.log('data:'+JSON.stringify(data));
});
websocket.on('error', err => {
    console.log('socket error : '+err)
    /* handle error 
});
websocket.on('close', () => {
  /* ... 
  console.log('websocket tancat');
});
*/

/*
async function productes(){
    let products = [];
    try{
        products = await publicClient.getProducts(); 
        //console.log(JSON.stringify(products));
    } catch (error){console.error(error);}
    console.log(JSON.stringify(products));
    let reals = products.map(d=>{return({'id': d.id,'base': d.base_currency,'referent': d.quote_currency,'display': d.display_name})});
    reals = reals.filter(d=>d.referent=='EUR');
    reals.forEach(d=>console.log(JSON.stringify(d)));
    //reals.forEach(d=>{

    //})
    try{
        var candles = await publicClient.getProductHistoricRates(
            'BTC-USD',
            { granularity: 60 },
          );
        } catch (error){console.error(error)}
        console.log(JSON.stringify(candles));
        console.log('lon : '+candles.length);
        candles.forEach(d=>{
            console.log('fechas : '+d[0]+' - '+new Date(d[0]*1000));
        });
    return (products);
}

let aux =  productes();
console.log('productes : '+JSON.stringify(aux));
*/


// hay que ver las velas , porque no son de un minuto, son de milisegundos
// tambien hay que revisar la aritmetica porque algo esta mal