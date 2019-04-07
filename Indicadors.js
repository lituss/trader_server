class Indicador{
    constructor(nom,parametresInfo){
        this.nom = nom;
        this.parametresInfo = parametresInfo;
        this.valor = 0; // -1 venta , 0 : stand by , 1 : compra
    }
    calcula(candle){};
    getParametresInfo(){
        return(this.parametresInfo);
    }

}

class SMA extends Indicador{
    constructor(nom,periodos){
        super(nom,['numero periodes']);
        //indicador = ti.SMA;
        this.periodos = periodos;
        this.data = [];
    }
    calcula(candle){
            
        if (data.lenght < periodos) {
            this.data.push(candle.close);
            return 0;
        }
        if (this.esvalid) return indicador.nextValue(candle.close);
            else {
                let myData = {};
                myData.period = periodos;
                myData.values = this.data;
                myData.values.push(candle.close);
                this.indicador = new ti.SMA(myData);
                this.esValid = true;
                return(indicador.getResult());
            }
        }

    

}

class MyEma extends Indicador{
    //{period: period,values: values}

    constructor(params){
        super('MyEma',['periodos']);
        try{
        this.data = params;
        this.resultat = [];
        this.anterior = 0;
        this.multiplicador = 2/(this.data.period + 1);
        this.calcula();
        }catch (e){console.log('excepcio : '+e)}
    }
    calcula(){
        let inicial = 0;
        
        
        let valor = 0;

        for (var f = 0 ; f < this.data.period ; f++) inicial+=this.data.values[f];
        inicial /=this.data.period;
        this.anterior = inicial;
        this.resultat.push(inicial);
        for (var f = this.data.period ; f < this.data.values.length; f++){
            valor = this.data.values[f]  * this.multiplicador + (1 - this.multiplicador)*this.anterior;
            this.anterior = valor;
            this.resultat.push(valor);
        }
    }
    getResult(){return this.resultat}
    nextValue(nouValor){
        let retorn = nouValor  * this.multiplicador + (1 - this.multiplicador)*this.anterior;
        retorn = retorn.toFixed(2);
        this.data.values.push(nouValor);
        this.resultat.push(retorn);
        this.anterior = retorn;
        return retorn;
    }
}


const ti = require('technicalindicators');
ti.setConfig('precision', 10);
const EMA = ti.EMA
let period = 8;
let values = [1,3,4,5,6,7,8,9,10,11,12,13,14,15];                    
/*let resultat = EMA.calculate({period : period, values : values});
let resultat2 = resultat.map((valor)=>{return(valor.toFixed(2))});
console.log('ti ema : '+resultat2);  
console.log('ti ema nextvalue :'+EMA.nextValue(16));
*/
const prova = new ti.EMA({period:8,values: values});
console.log('ti ema 2 : '+prova.getResult());
console.log('ti ema 2 next : '+prova.nextValue(16));
const aux = new MyEma({period: period, values: values});
console.log('my EMA : '+aux.getResult().map((valor)=>{return valor.toFixed(2)}));
console.log ('my EMA seguent : '+aux.nextValue(16));

/*console.log(aux.nextValue(16));


console.log('abans new');
const aux2 = new MyEma({'period': period, 'values': values});
console.log('despres new');
console.log(JSON.stringify(aux2.getResult()));


var tulind = require('tulind');
console.log("Tulip Indicators version is:");
console.log(tulind.version);

*/
/*
const tulind = require('tulind');
tulind.indicators.ema.indicator([values],[8], function(err,results){
    if (err) console.log('Tulip error : '+err);
    else console.log('Tulip EMA : '+results[0].map((valor)=>{return valor.toFixed(2)}));
});
*/
/*
var close = [4,5,6,6,6,5,5,5,6,4];
tulind.indicators.ema.indicator([values], [period], function(err, results) {
    console.log("Result of sma is:");
    console.log(results[0]);
  });
  */

 


 class tiEma extends Indicador{
     constructor(dades){
         //console.log('tiEma dades : '+JSON.stringify(dades));
         super('EMA',['Numero de periodes']);
         this.indicador = new ti.EMA(dades);
         
         this.resultat = this.indicador.getResult().map((valor)=>{return(valor)});
         //this.resultat = this.indicador.getResult();
         //console.log('resultat : '+this.resultat);
     }
     getResult(){return this.resultat}
     nextValue(nouValor){return this.indicador.nextValue(nouValor)}
 }

 const mytiEMA = new tiEma({period : period, values : values});
 console.log('ti ema : '+mytiEMA.getResult());  
console.log('ti ema nextvalue :'+mytiEMA.nextValue(16).toFixed(2));

module.exports = {tiEma}
