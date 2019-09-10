const {Sfs} = require ('./Sfs.js');

class Mayor{
    apunta(fechaUnix,valor1,valor2,preu){
        let operacion = {};
        operacion.fechaUnix = fechaUnix;
        operacion.valor1 = valor1;
        operacion.valor2 = valor2;
        operacion.preu = preu;
        this.operaciones.push(operacion); 
        console.log('operacion : '+JSON.stringify(operacion));
    }
    constructor(moneda,monedaReferent,valorMoneda,valorReferent,fechaUnix){
        this.moneda = moneda;
        this.monedaReferent = monedaReferent;
        this.valorMoneda = valorMoneda;
        this.valorReferent = valorReferent;
        this.operaciones = [];
        this.apunta(fechaUnix,valorMoneda,valorReferent);
    }
    lista(){
        let moneda1 = 0;
        let moneda2 = 0;
        let fecha = null;
        console.log("Libro mayor "+this.moneda+' : '+this.monedaReferent + ' operacions : '+ this.operaciones.length);
        for (var index = 0 ; index < this.operaciones.length ; index ++){
            moneda1+= this.operaciones[index].valor1;
            moneda2+= this.operaciones[index].valor2;
            fecha = new Date(this.operaciones[index].fechaUnix * 1000);
            let linea = fecha.toDateString()+' ::: '+this.operaciones[index].fechaUnix + ' :: '+ 
            this.operaciones[index].valor1 + ' : ' + this.operaciones[index].valor2+' --> '+moneda1+ ' : '+moneda2+' ( '+this.operaciones[index].preu+' )';
            console.log(linea);
        }
        console.log('Tancament llibre amb '+this.operaciones.length+'operacions --------------');
    }
}

class NewMayor{
    constructor(){
        this.apunts = [];
    }
    apunta(date,exchange,moneda,monedaReferent,_import,_importReferent,valorCanvi){
        let apunt = {'date': date,'exchange': exchange,'moneda': moneda,'monedaReferent': monedaReferent,'_import': _import,'_importReferent': _importReferent,'valorCanvi':valorCanvi};
        console.log('major --> '+JSON.stringify(apunt));
        this.apunts.push(apunt);
    }
    get(){
        return this.apunts;
    }
}

class Bitlletera {
    constructor(exchange,monedaPrincipal,monedaReferent,importPrincipal,importReferent,makerFee,takerFee,date){
        this.exchange = exchange;
        this.monedaPrincipal = monedaPrincipal;
        this.monedaReferent = monedaReferent;
        this.importPrincipal = importPrincipal;
        this.importReferent = importReferent;
        this.makerFee = makerFee;
        this.takerFee = takerFee;
        this.llibreMajor = new Mayor(monedaPrincipal,monedaReferent,importPrincipal,importReferent,(Date.parse(date)/1000));
    }
    compra(candle){
        let preu = candle.close;
        // exemple , principal dolar , referent pesseta , canvi 1 $ = 100 pts i que tenim 500 pts
        // compra seria (this.importReferent / preu) * takerFee = 500/100 *1.002 = 5.01
        // $ = $ + 5
        // pts = 0
        //x/preu = 1.2Y -> y = x/(preu*1.002) : y = 4.99
        /*
        let referentCompra = this.importReferent/(1 + this.takerFee);
        let valorCompra = this.importReferent / (preu * (1 + this.takerFee) );
        let fee = valorCompra*this.takerFee;
        this.importPrincipal+=valorCompra;
        this.importReferent-=referentCompra;
        this.llibreMajor.apunta(candle.dataUnix,valorCompra,-referentCompra);
        */

        // si no hi ha saldo no es fa la compra
        if (this.importReferent<= 0) return; 
        let feeReferent = this.takerFee*this.importReferent;
        let  compraReal = (this.importReferent - feeReferent)/preu;
        this.llibreMajor.apunta(candle.dateUnix,compraReal,-this.importReferent,preu);
        this.importPrincipal +=compraReal;
        this.importReferent = 0;
       
    }

    ven(candle){
        let preu = candle.close;
        // si no hi ha saldo a vendre no es fa la venda
        if (this.importPrincipal<=0) return;
        let feePrincipal = this.importPrincipal*this.takerFee;
        let vendaReal = (this.importPrincipal - feePrincipal)*preu;
        console.log('candle: '+JSON.stringify(candle));
        this.llibreMajor.apunta(candle.dateUnix,-this.importPrincipal,vendaReal,preu);
        this.importPrincipal = 0;
        this.importReferent += vendaReal;

        /*
        let valorVenda = this.importPrincipal/(1 + this.takerFee);
        let valorCompra = valorVenda*preu; 
        this.importPrincipal -= valorVenda;
        this.importReferent += valorCompra;
        this.llibreMajor.apunta(candle.dataUnix,valorVenda,)
        */
    }

    mostraResultats(){
        console.log ('Resultats bitlletera : '+this.exchange+' '+this.monedaPrincipal+' '+this.monedaReferent+ ' --> '+this.importPrincipal+' : '+this.importReferent);
        this.llibreMajor.lista();
    }
    getAll(){

        let saldoFinal = this.importPrincipal *this.llibreMajor.operaciones[this.llibreMajor.operaciones.length - 1].preu + this.importReferent;
        return ({'saldoFinal': saldoFinal,'llibre': this.llibreMajor.operaciones});
    }

}

class NewBitlletera {
    constructor(exchange,monedaPrincipal,monedaReferent,importPrincipal,importReferent,makerFee,takerFee){
        this.exchange = exchange;
        this.monedaPrincipal = monedaPrincipal;
        this.monedaReferent = monedaReferent;
        this.importPrincipal = importPrincipal;
        this.importReferent = importReferent;
        this.makerFee = makerFee;
        this.takerFee = takerFee;
        //this.llibreMajor = new Mayor(monedaPrincipal,monedaReferent,importPrincipal,importReferent,(Date.parse(date)/1000));
    }
    compra(preu,_import){
        //let preu = candle.close;
        // exemple , principal dolar , referent pesseta , canvi 1 $ = 100 pts i que tenim 500 pts
        // compra seria (this.importReferent / preu) * takerFee = 500/100 *1.002 = 5.01
        // $ = $ + 5
        // pts = 0
        //x/preu = 1.2Y -> y = x/(preu*1.002) : y = 4.99
        /*
        let referentCompra = this.importReferent/(1 + this.takerFee);
        let valorCompra = this.importReferent / (preu * (1 + this.takerFee) );
        let fee = valorCompra*this.takerFee;
        this.importPrincipal+=valorCompra;
        this.importReferent-=referentCompra;
        this.llibreMajor.apunta(candle.dataUnix,valorCompra,-referentCompra);
        */
        console.log('bitlletera compra ...');
        // si no hi ha saldo no es fa la compra
        if (this.importReferent< _import ) return false; 
        let feeReferent = this.takerFee*_import;
        let  compraReal = (_import - feeReferent)/preu;
        //this.llibreMajor.apunta(candle.dateUnix,compraReal,-this.importReferent,preu);
        this.importPrincipal +=compraReal;
        this.importReferent -= _import;
        return {'principal': compraReal,'referent': _import};
       
    }

    ven(preu){
        //let preu = candle.close;
        // si no hi ha saldo a vendre no es fa la venda
        console.log('bitlletera ven ...');
        if (this.importPrincipal<=0) return false;
        let principal = this.importPrincipal;
        let feePrincipal = this.importPrincipal*this.takerFee;
        let vendaReal = (this.importPrincipal - feePrincipal)*preu;
        //console.log('candle: '+JSON.stringify(candle));
        //this.llibreMajor.apunta(candle.dateUnix,-this.importPrincipal,vendaReal,preu);
        this.importPrincipal = 0;
        this.importReferent += vendaReal;
        return {'principal': principal,'referent': vendaReal};

        /*
        let valorVenda = this.importPrincipal/(1 + this.takerFee);
        let valorCompra = valorVenda*preu; 
        this.importPrincipal -= valorVenda;
        this.importReferent += valorCompra;
        this.llibreMajor.apunta(candle.dataUnix,valorVenda,)
        */
    }

    mostraResultats(){
        console.log ('Resultats bitlletera : '+this.exchange+' '+this.monedaPrincipal+' '+this.monedaReferent+ ' --> '+this.importPrincipal+' : '+this.importReferent);
        this.llibreMajor.lista();
    }
    getAll(){

        let saldoFinal = this.importPrincipal *this.llibreMajor.operaciones[this.llibreMajor.operaciones.length - 1].preu + this.importReferent;
        return ({'saldoFinal': saldoFinal,'llibre': this.llibreMajor.operaciones});
    }

}
class _Bitlletera{
    constructor(exchange,moneda,importInicial,socket){
        this.exchange = exchange;this.moneda=moneda;this._import = importInicial
        this.importInicial = importInicial;
        this.socket = socket;
        this.apunts=[];
        this.myFs = new Sfs(exchange.nom+'.'+moneda+'.bit.txt','bitlletera',socket,['bitlleteres']);
        let aux = {'fecha': new Date(),'tipus': 'parcial','valor': importInicial};
        this.apunts.push(aux);
        this.myFs.wf(aux);
    }
    enviaHistorial(){
        //newSocket.send({'tipus': 'saldo','valor': this.importInicial});
        let saldo = 0;
        this.apunts.forEach(a=>{
            a.canals=['bitlleteres'];
            a.nom = this.myFs.nomFitxer;
            let aux = JSON.stringify(a);
            console.log('sincro bitlleteres : '+JSON.stringify(aux));
            this.socket.send(aux);
            if (a.tipus == 'parcial') saldo+=a.valor;
        });
        // enviem saldo
        let packet = {};
        packet.canals=['bitlleteres'];
        packet.nom = this.myFs.nomFitxer;
        packet.tipus='saldo';
        packet.valor = saldo;
        this.socket.send(JSON.stringify(packet));
    }
    put(_import){
        let aux = {'fecha': new Date(),'tipus': 'parcial', 'valor': _import};
        this.apunts.push(aux);
        this.myFs.af(aux);
        this._import+=_import;
        this.myFs.af({'fecha': new Date(),'tipus': 'saldo','valor': this._import});
        return _import;
    }
    
    get(_import){
        if (_import == 0 || this._import - _import <= 0) return null;
        let aux = {'fecha': new Date(),'tipus': 'parcial','valor': -_import};
        this.apunts.push(aux);
        this.myFs.af(aux);
        this._import-=_import;
        this.myFs.af({'fecha': new Date(),'tipus': 'saldo','valor': this._import});
        return _import;
    }

    getAll(){
        if (this._import == 0) return null;
        let aux = {'fecha': new Date(),'tipus': 'parcial','valor': -this._import};
        this.apunts.push(aux);
        this.myFs.af(aux);
        let retorn = this._import;
        this._import=0;
        this.myFs.af({'fecha': new Date(),'tipus':'saldo','valor': 0});
        return retorn;
    }

    show(){
        console.log(this.exchange.nom+' : '+this.moneda+' :: '+this._import);
    }
}

//const fs = require ('fs');
//const path = require('path');
/*
class Sfs{
    constructor(nomFitxer){
       // this.readFileAsync = promisify(fs.readFile);
       // this.writeFileAsync = promisify(fs.writeFile);
       // this.appendFileAsync = promisify(fs.appendFileSync appendFile);
        this.nomFitxer = nomFitxer;
        console.log('path resolve : '+ path.resolve(nomFitxer));
    }
    rf(){
        var data;
        try{
            //data = await this.readFileAsync(this.nomFitxer);
            data = JSON.parse(fs.readFileSync(this.nomFitxer));
            return data;
        } catch (e) {console.log('Error en lectura sincrona de fichero '+this.nomFitxer+' : '+e)}
        
    }
    wf(data){
        try{
            fs.writeFileSync(this.nomFitxer,JSON.stringify(data));
            return;
        } catch (e){
            console.log('Error en escritura sincrona '+this.nomFitxer+' : '+e);
        }
    }
    af(data){
        try{
            fs.appendFileSync(this.nomFitxer,JSON.stringify(data));
            return;
        } catch (e){
            console.log('Error en escritura sincrona '+this.nomFitxer+' : '+e);
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
        }
    }
}
*/

module.exports = {Bitlletera,Mayor,NewMayor,NewBitlletera,_Bitlletera}