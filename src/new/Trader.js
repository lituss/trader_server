let {Sql} = require ('./Sql.js');
let {WsServer} = require('./Wsserver.js');
//let {Sincronitza} = require('./Sincronitza.js');
let {Exchange} = require('./Exchanges.js');


class Trader {
    constructor(){
        this.sql = new Sql();
        this.constants = new Constants(this.sql);
        this.WsServer = new WsServer(this);
        this.exchange = new Exchange(this);
//        this.sincronitza = new Sincronitza(this);
        this.init();
        //console.log('constant : ',this.constants.get('autoSync'));
        
        
    }
    async init(){
        this.autoSync = await this.constants.get('autoSync')
        console.log('constant : ',this.autoSync);
        if (this.autoSync === "undefined") {
            console.log('constant autoSync no trobada ');
            await this.constants.set('autoSync','S');
        }
        else if (this.autoSync==="S") this.sincronitza();
        else console.log ("no autoSync!!");
        
    }

    async sincronitza(){
        console.log('executant sincronitza init ...');
        let parells = await this.exchange.getPairs();
        console.log('parells : ',parells);
        await this.sql.updatePairs(parells);
        let dbParells = await this.sql.getPairs();
        console.log('dbPArells : ',dbParells);
        //let parells = await this.getGdaxPairs();
        await this.exchange.sincronitzaDB(dbParells);
        console.log('BD sincronitzada');
    }
}



class Constants {
    constructor(sql){
        this.sql = sql;
    }
    async get(variable){
        return await this.sql.getConstant(variable);
    }
    async set(variable,valor){
        await this.sql.setConstant(variable,valor);
    }
}

new Trader();