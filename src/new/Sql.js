const mysql = require('mysql');

class Sql{
    constructor(){
      
        try{
            if (!this.con){
                this.con =  mysql.createConnection({
                    host: "192.168.2.111",
                    user: "trader",
                    password: "Temp001.",
                    database: "tb",
                    insecureAuth: true
                    });
        
                this.con.connect(function(err) {
                    if (err) throw err;
                    console.log("Connected!");
                    });
                }
            }catch (e){
                console.log('Error en conecta sql : '+e);
            }
    }

    //----- constants
    getConstant(variable){
        let sentencia = `select value from constants where name = ?`;
        return new Promise((resolve,reject)=>{
            this.con.query(sentencia,[variable],(err,resp)=>{
                console.log(err,resp);
                let retorn = "undefined";
                if (resp.length === 1) retorn = resp[0].value;
                else if (resp.length > 1) reject('constant duplicada');
                resolve(retorn);
            })
        })
    }

    async setConstant(variable,valor){
        let inserta = false;
        if ((await this.getConstant(variable))==="undefined") inserta = true; 
        return new Promise((resolve,reject)=>{
            if (inserta){
                this.con.query('insert into constants(name,value) values (?,?)',[variable,valor],(err,resp)=>{
                    if (err) reject(err);
                    resolve();
                })
            }
            else
                this.con.query('update constants set value = ? where name = ?',[valor,variable],(err,resp)=>{
                    if (err) reject(err);
                    resolve();
                })
        })
    }
    // ------------ fi constants

    getPair(exchange,pair){
        return new Promise((resolve,reject)=>{
            this.con.query('select pair,dateInit,dateEnd,status from pairs where exchange = ? and pair = ?',[exchange,pair],(err,resp)=>{
                if (err) reject(err);
                if (resp)resolve(resp[0]); else resolve();
            })
        })

    }
    setPair(exchange,pair){

    }

    insertPair(exchange,pair,dateInit,dateEnd){
        return new Promise((resolve,reject)=>{
            this.con.query('insert into pairs (exchange,pair,dateInit,dateEnd,status) values (?,?,?,?,?)',
            [exchange,pair,dateInit,dateEnd,0],(err,resp)=>{
                if (err) reject(err);
                resolve();
            })
        })
    }

    async getPairs(){
        return new Promise(async (resolve,reject)=>{
            this.con.query('select exchange,pair,dateInit,dateEnd,status from pairs',async(err,resp)=>{
                if (err) reject(err);
                for (let f = 0 ; f < resp.length ; f++){
                    let registre = resp[f];
                    let minMax;
                    minMax = await this.getFirstLast(registre.exchange,registre.pair);
                    console.log('minMax',minMax);
                    if (minMax ){
                        console.log('candles '+registre.exchange+' '+registre.pair+' : minim -> '+new Date(minMax.minim*1000)+' maxim : '+new Date(minMax.maxim*1000));
                        registre.dateInit = new Date(minMax.maxim*1000 + 60000);
                        //tractem dates
                    }
                }
                resolve(resp);
            })
        })

    }
    

    async updatePairs(pairs){
        let dateIniDef = new Date(2018,0,1,0,0,0,0);
        let dateFiDef = new Date();
        pairs.forEach(async (pair)=>{
            let parell = await this.getPair(pair.exchange,pair.pair);
            if (!parell) await this.insertPair(pair.exchange,pair.pair,dateIniDef,dateFiDef);
        })
    }


    getFirstLast(exchange,pair){
        let sentencia = 'select exchange,pair,min(dateunix) minim,max(dateunix) maxim from candles where exchange = ? and pair = ? group by exchange,pair';
        return new Promise((resolve,reject)=>{
            this.con.query(sentencia,[exchange,pair],function(err,resp){
                if (err) throw err;
                console.log('resposta getfirstlast : ',resp);
                if (resp.length > 0) console.log('minim : '+new Date(resp[0].minim*1000) + ' , maxim : ' + new Date(resp[0].maxim*1000));
                resolve(resp[0]);
            });
        })    
    }

    insertCandle(candle){

  //var sql = "INSERT INTO customers (name, address) VALUES ('Company Inc', 'Highway 37')";
        return new Promise((resolve,reject)=>{

        let sentencia = 'insert into candles(exchange,pair,dateunix,open,close,high,low,volume) values (?,?,?,?,?,?,?,?)';
        this.con.query(sentencia,[candle.exchange,candle.pair,candle.dateunix,candle.open,candle.close,candle.high,candle.low,candle.volume],
             function (err, result) {
            if (err) {
                //console.log(err);
                if ( err.code == 'ER_DUP_ENTRY' ) console.log("Error en sql, registro duplicado");
                else {
                    console.log('error en SQL : '+err);
                    //console.log(JSON.stringify(sql));
                    reject();
                }
            }
            //else console.log("1 record inserted");
            resolve();
        });
    });
    }
}


module.exports = {Sql}