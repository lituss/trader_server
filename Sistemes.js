Indicadors = require ('./Indicadors.js');

class SistemaMitges{

    constructor(candles,parametres){
        console.log('sistema , candles rebudes '+candles.length);
        this.parametres = parametres;
     //   console.log('parametres : '+JSON.stringify(parametres));
        let valors = this.getClose(candles);
        //valors.forEach((valor)=>{console.log('valors : '+valor)});
        //this.mostra(valors,-250);
        this.par ={};
        parametres.indicadors.forEach((auxvalor)=>{
            auxvalor.parametres.forEach((auxvalor2)=>{
                //console.log('auxvalor.nom : ' + auxvalor.nom +' :: auxvalor2.valor : '+ auxvalor2.valor);
                this.par[auxvalor.nom] = parseInt(auxvalor2.valor);
            }); 
        });
        console.log('parametres decodificats : '+JSON.stringify(this.par));
        this.ema20 = new Indicadors.tiEma({period: this.par['Ema_curta'], values: valors});
        this.res20 = this.ema20.getResult();this.ompla(this.res20,this.par['Ema_curta']);
        //this.mostra(res20,250);
        
        this.ema50 = new Indicadors.tiEma({period: this.par['Ema_mitja'], values: valors});
        this.res50 = this.ema50.getResult();this.ompla(this.res50,this.par['Ema_mitja']);
        this.ema200 = new Indicadors.tiEma({period: this.par['Ema_llarga'], values: valors});
        this.res200 = this.ema200.getResult();this.ompla(this.res200,this.par['Ema_llarga']);
        console.log('lon candles,20,50,200 : '+candles.length+' : '+this.res20.length+' : '+this.res50.length+' : '+this.res200.length);
        this.resultat = [];
        this.deltaOperacions = 0;
        //console.log('ema20 : '+JSON.stringify(ema20));
        this.resultat = this.calcula(this.res20,this.res50,this.res200,valors);
        this.candles = candles;
        
    }
    mostra(cadena,iter){
        if (iter < 0 ){
            for (var f = cadena.length + iter ; f < cadena.length; f++) console.log('index : '+f+' : '+cadena[f]);
        }
        else 
            for ( var f = 0 ; f < iter ; f++)console.log('index : '+f+' : '+cadena[f]);
    }
    getClose(candles){
        try{
            return candles.map((valors)=>{return valors.close;});
        } catch(e){console.log('error en getclose : '+e)}
    }
    ompla(valors,iter){
        for (var f = 1 ; f < iter ; f++) valors.unshift(undefined);
    }
    calcula(res20,res50,res200,preu){
        var resultat = [];
        var compra,operacio;
        for (var f = 0 ; f < this.par['Ema_llarga'] ; f++) resultat.push(0); 
        if (res20[this.par['Ema_llarga']] > res50[this.par['Ema_llarga']]) this.perSobre = true;else this.perSobre = false;
        resultat.push(0);
        for (var f = this.par['Ema_llarga'] + 1; f < preu.length ; f++){
            if (preu[f] > res200[f]) compra = true;else compra = false;
            operacio = 0;
            if (this.perSobre && (res20[f]< res50[f]) && (!compra)){
                if (this.deltaOperacions == 0){
                    operacio = -1;
                    this.deltaOperacions = 5;
                }
            }
                 //venda
                // la de 20 talla a la de 50  baixant i la tendencia
                // es alcista -> senyal de venda
            else {
                if(!this.perSobre && (res20[f] >= res50[f]) && compra){
                    //console.log('hauria de comprar ');
                    if (this.deltaOperacions == 0){
                        operacio = 1;
                        this.deltaOperacions = 5;
                    }
                 // compra
                }
            }
        
            if (this.deltaOperacions > 0) this.deltaOperacions --;
            resultat.push(operacio);
        //    console.log('debug : preu, compra , perSobreAbans perSobreAra operacio delta ->'+preu[f]+' # '+compra+' # '+this.perSobre+' # '+res20[f]<res50[f]+' # '+operacio+' # '+this.deltaOperacions);
            this.perSobre = (res20[f] > res50[f]); 
        }
        //console.log('lon resultat i candles : '+resultat.length+' , '+preu.length);
        return resultat;
    }
    getResult(){
        //console.log('lon resultat i candles : '+this.resultat.length+' , '+preu.length);
        return this.resultat}

    next(candle){
        let res20 = this.ema20.nextValue(candle.close); 
        let res50 = this.ema50.nextValue(candle.close);
        let res200 = this.ema200.nextValue(candle.close);
        let operacio = 0;
        // encara no tenim prou candles per començar
        let preu = candle.close;
        let compra = false;
        if (this.candles.length > this.parametres.minCandles) {
            if (preu > res200) compra = true;else compra = false;
            if (this.perSobre && (res20< res50) && (!compra)){
                if (this.deltaOperacions == 0){
                    operacio = -1;
                    this.deltaOperacions = 5;
                }
            }
                //venda
                    // la de 20 talla a la de 50  baixant i la tendencia
                    // es alcista -> senyal de venda
            else{ 
                if(!this.perSobre && (res20 >= res50) && compra){
                    //console.log('hauria de comprar (next)...');
                    if (this.deltaOperacions == 0){
                        operacio = 1;
                        this.deltaOperacions = 5;
                    }
                }
            }        // compra
        }
        if (this.deltaOperacions > 0) this.deltaOperacions --;
        this.res20.push(res20);
        this.res50.push(res50);
        this.res200.push(res200);
        this.resultat.push(operacio);
        this.perSobre = (res20 > res50);
        // empaquetem les dades noves i retornem a qui ha cridat a la funcio que es qui finalment ho enviara al client

        let detail = candle;
        //detail.dateunix = new Date(candle.dateunix * 1000).toUTCString();
        detail.ema_curta = res20;
        detail.ema_mitja = res50;
        detail.ema_llarga = res200;
        detail.resultat = operacio;
        
        return (detail); 
    }

    getAll(data){
        let cab1 = [{valor: 'Candles', val: 6},{valor: '3Emas', val: 4}];
        let cab2 = ['data','low','high','open','close','volume',
        'ema_curta','ema_mitja','ema_llarga','3Emas'];
        
        //let detail = this.candles;
        let detail = [];

        for (var f = 0 ; f< this.candles.length ; f++){
        
            this.candles[f].ema_curta = this.res20[f];
            this.candles[f].ema_mitja = this.res50[f];
            this.candles[f].ema_llarga = this.res200[f];
            this.candles[f].resultat = this.resultat[f];
        }

        if (data){
            let candles_a_retornar = 400;
            let auxData = Date.parse(data)/1000;
            let index = this.candles.findIndex(d=>{if (d.dateunix < auxData + 1000 && d.dateunix > auxData - 1000) return true;});
            let posIni = (index < candles_a_retornar/2 ? 0 : index - candles_a_retornar / 2);
            let posFi = (index + candles_a_retornar/2 > this.candles.length ? this.candles.length - 1  : index + candles_a_retornar / 2);
        
            for (var f = posIni; f < posFi ; f++) detail.push(this.candles[f]);
        } 
        else 
            detail = this.candles;

//convertim la data 
// no la convertim perque ja esta en format date
        /*detail.forEach((valor)=>{
            var aux = new Date(valor.dateunix*1000).toUTCString();
            //console.log('aux : '+aux);
            valor.dateunix = aux;
            //return (valor);
        });*/
// parametres per la grafica

        let grafica = [
            {'nom_indicador': 'velas','tipus': 'velas','nom_inputs': ['dateunix','low','high','open','close','volume'],'nom_outputs': ['mecha_low','velas','mecha_high']},
        {'nom_indicador': '3Emas','tipus': 'marquesTrading','nom_inputs': ['dateunix','resultat'],'nom_outputs': ['MarquesTrading']},
        {'nom_indicador': 'emaCurta','tipus': 'linePath','nom_inputs': ['dateunix','ema_curta'],'nom_outputs': ['emaCurta'],'color_outputs': ['blue']},
        {'nom_indicador': 'emaMitja','tipus': 'linePath','nom_inputs': ['dateunix','ema_mitja'],'nom_outputs': ['emaMitja'],'color_outputs': ['yellow']},
        {'nom_indicador': 'emaLLarga','tipus': 'linePath','nom_inputs': ['dateunix','ema_llarga'],'nom_outputs': ['emaLLarga'],'color_outputs': ['green']}
        ];
        //console.log('resultats per taula : '+JSON.stringify(detail));
        return {'cab1': cab1,'cab2': cab2, 'grafica': grafica,'detail': detail};
    }

    static info(){
        return({nom: '3EMAS',classe: 'SistemaMitges',indicadors: [{nom: 'Ema_curta',pes: 1,parametres: [{nom: 'Periodes',valor: 20}]},{nom: 'Ema_mitja',pes: 1,parametres:[{nom: 'Periodes',valor: 50}]},{nom: 'Ema_llarga',pes: 1,parametres:[{nom:'Periodes',valor: 200}]}]});
    }
}

module.exports = {SistemaMitges}