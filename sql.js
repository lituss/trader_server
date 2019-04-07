mysql = require('mysql');
util = require('util');
var con;

function conecta(){
    try{
        con =  mysql.createConnection({
            host: "localhost",
            user: "trader",
            password: "Temp001.",
            database: "tb",
            insecureAuth: true

        });

        con.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");
            });
        }catch (e){
            console.log('Error en conecta sql : '+e);
        }
}

function insertCandle(candle){insert('candles',candle)}

function insert(table,object){
  var sql = constructSQL(table,'insert',object);  
  //var sql = "INSERT INTO customers (name, address) VALUES ('Company Inc', 'Highway 37')";
  con.query(sql, function (err, result) {
    if (err) {
        //console.log(err);
        if ( err.code == 'ER_DUP_ENTRY' ) console.log("Error en sql, registro duplicado");
        else {
            console.log('error en SQL : '+err);
            console.log(JSON.stringify(sql));
        }
    }
    else console.log("1 record inserted");
  });
}
  function constructSQL(taula,operacio,objecte){
    switch(operacio){
        case 'insert' : 
        aux = "INSERT INTO "+taula+"("+noms(objecte)+")"+" VALUES ("+valors(objecte)+")";
        console.log('sentencia sql : '+ aux);
        break;
        default:
        console.log("Error constructSQL, operacion no definida");
        throw -1;
    }
    return aux;
  }
  function noms(objecte){
      var resultat='';
      first = true;
      let f = null;
      for (f in objecte){
          if (!first) resultat+=' , '; else first = false;
          resultat+=f;
      }
      return resultat;
  }

  function valors (objecte){
    var resultat='';
    first = true;
    let f = null;
    for (f in objecte){
        if (!first) resultat+=' , '; else first = false;
        resultat+=objecte[f];
    }
        return resultat;
 }
function getFirstLast(exchange){
    let sentencia = 'select exchange,pair,min(fechaunix),max(fechaunix) from candles\
    where exchange = ? group by exchange,pair';
    resposta = [];
    con.query(sentencia,[exchange],function(err,resp){
        if (err) throw err;
        resposta = JSON.parse(resp);
        console.log('resposta getfirstlast : '+resposta);
          });
    return resposta;
    


}
async function localizaDups(exchange,pair){
    return new Promise(function (resolve,reject){
        let duplicats = 0;
        let sentencia = 'select exchange,pair,dateunix from candles where exchange = ? and pair = ? group by exchange,pair,dateunix having count(*) > 1';
        con.query(sentencia,[exchange,pair],function(err,resp){
            if (err) throw err;
            resolve(resp);
        })
    })
}

async function buscaIdsDups(exchange,pair,dateunix){
    return new Promise(function (resolve,reject){
        let sen = 'select idcandles from candles where exchange = ? and pair = ? and dateunix = ?';
        con.query(sen,[exchange,pair,dateunix],function(err,resp2){
            if (err) throw err;
            console.log('resp2 : '+JSON.stringify(resp2));
            resolve(resp2);
        })
    })
}

async function eliminaDups(exchange,pair){
            let dups =  await localizaDups(exchange,pair);
            if (dups.length > 0) {
            console.log('resp : '+JSON.stringify(dups));
            let resp2=null;
            for (let f = 0; f < dups.length; f++){
                try{
                resp2 =  await buscaIdsDups(exchange,pair,dups[f].dateunix);     
            }catch (e){ throw e};     
                resp2.forEach((d2,index)=>{
                    if(index > 0) {
                        let esborra = 'delete from candles where idcandles = ?';
                        con.query(esborra,[d2.idcandles],function(err,resp3){
                            if (err) throw err;
                        })

                    }
                })
                
            }
        }
            return new Promise(function (resolve,reject){resolve(dups.length)});
}

async function buscaForats(exchange,pair){
    return new Promise(function (resolve,reject){
        let sen = 'select dateunix from candles where exchange = ? and pair = ? order by exchange,pair,dateunix';
        con.query(sen,[exchange,pair],function(err,resp){
            let ini = resp[0].dateunix;
            let forats = [];
            for (let f = 1; f< resp.length ; f++){
                let actual = resp[f].dateunix;
                if ((actual - ini) > 300) {
                    console.log('forat entre : '+ini+' : '+actual+ ' ('+(actual - ini)+')'+new Date(ini*1000));
                    forats.push({'ini': ini,'fi': actual});
                }
                ini = actual;
            }
            resolve (forats);
        })
    })
}

async function getLastDate(exchange,pair){
    return new Promise(function (resolve,reject){
        let sentencia = 'select Max(dateunix) as maxim from candles where exchange = ? and pair = ?';
        let resposta = [];
        con.query(sentencia,[exchange,pair],(err,resp)=>{
            if (err) {
                console.log('error al obtenir la ultima data de la base de dades');
                throw err;
            }
            console.log('lastDate : '+resp[0].maxim);
            resolve(resp[0].maxim);
        })
    })
}

async function getCountCandlesByDate(exchange,pair,dateini,datefi){
    //let resposta = null;
    let resposta = await asyncGetCountCandlesByDate(exchange,pair,dateini,datefi);
    //resposta.then(function(response){resposta = response });
    console.log('promesa : '+resposta);
    return resposta;
}
function asyncGetCountCandlesByDate(exchange,pair,dateini,datefi){
    return new Promise(function (resolve,reject){
        let sentencia = 'select count(*) as total from candles where exchange = ? and pair = ? and dateunix between ? and ? ';
        let resposta = [];
        con.query(sentencia,[exchange,pair,dateini,datefi],(err,resp)=>{
        if (err){
            console.log('error en contador : '+err);
            throw err;
        }
        console.log('retorn contador sql : '+JSON.stringify(resp));
        console.log('valor net : '+resp[0].total);
        
        resolve(resp[0].total);
    });
});
    
}
function getNewPairs(exchange='Binance'){

}

function desconecta(){con.disconnect();}

async function getCandles2(exchange,pair,initialDate,endDate,granularity){
    let respuesta = [];
    //
    try{
    con =  mysql.createConnection({
        host: "localhost",
        user: "trader",
        password: "Temp001.",
        database: "tb",
        insecureAuth: true

    });

    con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        });
    }catch (e){
        console.log('Error en conecta sql : '+e);
    }
    //
    //con.connect();
    //catch(e) {console.log ('Error en conecta sql : '+e);}
    //console.log(JSON.stringify(con));
    console.log ('getCandles estado conexion mysql : '+con.state);
    const query = util.promisify(con.query).bind(con);
    console.log('parametres getCandles :: exchange,pair,initialDate,endDate,granularity :'+exchange+','+pair+','+initialDate.getTime()/1000+','+endDate.getTime()/1000+','+granularity);
    let sentencia = 'select * from candles where exchange = ? and pair = ? and dateunix between  ? and ? order by dateunix;';
    try{
        let resp = await query(sentencia,[exchange,pair,initialDate.getTime()/1000,endDate.getTime()/1000]);
        console.log('candles : '+resp.length+'initialDate : '+initialDate);
        if (resp.length == 0){console.log ('sqlGetCandles : ' + sentencia + 'sin resultados');throw 'Sin resultados';}
        let lCandle = {dateUnix : resp[0].dateunix, low : resp[0].low , high : resp[0].high , open : resp[0].open , close : resp[0].close , volume : resp[0].volume};
        let limit = initialDate.getTime() + granularity;
        for (index = 1 ; index < resp.length ; index++){
            if (resp[index].dateunix < limit){
                if (resp[index].low < lCandle.low) lCandle.low = resp[index].low;
                if (resp[index].high > lCandle.high) lCandle.high = resp[index].high;
                lCandle.volume+=resp[index].volume;
            }
            else {
                lCandle.close = resp[index.close];
                respuesta.push(lCandle);
                // iniciem seguent candle
                lCandle = {dateUnix : resp[index].dateunix, low : resp[index].low , high : resp[index].high , open : resp[index].open , close : resp[index].close , volume : resp[index].volume};
            }
        }
        // complertem la ultima 
        lCandle = {dateUnix : resp[index].dateunix, low : resp[index].low , high : resp[index].high , open : resp[index].open , close : resp[index].close , volume : resp[index].volume};
        respuesta.push(lCandle);
        return (respuesta);
    } catch (e){
                console.log('error en getcandles : '+e);
      }
        
    //return (respuesta);
}



function getCandles(exchange,pair,initialDate,endDate,granularity){
    let respuesta = [];
    //
    try{
    con =  mysql.createConnection({
        host: "localhost",
        user: "trader",
        password: "Temp001.",
        database: "tb",
        insecureAuth: true

    });

    con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        });
    }catch (e){
        console.log('Error en conecta sql : '+e);
    }
    //
    //con.connect();
    //catch(e) {console.log ('Error en conecta sql : '+e);}
    //console.log(JSON.stringify(con));
    console.log ('getCandles estado conexion mysql : '+con.state);
    //const query = util.promisify(con.query).bind(con);
    console.log('parametres getCandles :: exchange,pair,initialDate,endDate,granularity :'+exchange+','+pair+','+initialDate.getTime()/1000+','+endDate.getTime()/1000+','+granularity);
    let sentencia = 'select * from candles where exchange = ? and pair = ? and dateunix between  ? and ? order by dateunix;';
    
        con.query(sentencia,[exchange,pair,initialDate.getTime()/1000,endDate.getTime()/1000],(resp,err)=>{
            return new Promise(function(resolve,reject){
                if (err) {
                    console.log('error en sentencia sql : '+err);
                    
                }
                console.log('candles : '+resp.length+'initialDate : '+initialDate);
                if (resp.length == 0){console.log ('sqlGetCandles : ' + sentencia + 'sin resultados');throw 'Sin resultados';}
                let lCandle = {dateUnix : resp[0].dateunix, low : resp[0].low , high : resp[0].high , open : resp[0].open , close : resp[0].close , volume : resp[0].volume};
                let limit = initialDate.getTime() + granularity;
                for (index = 1 ; index < resp.length ; index++){
                    if (resp[index].dateunix < limit){
                        if (resp[index].low < lCandle.low) lCandle.low = resp[index].low;
                        if (resp[index].high > lCandle.high) lCandle.high = resp[index].high;
                        lCandle.volume+=resp[index].volume;
                    }
                    else {
                        lCandle.close = resp[index.close];
                        respuesta.push(lCandle);
                        // iniciem seguent candle
                        lCandle = {dateUnix : resp[index].dateunix, low : resp[index].low , high : resp[index].high , open : resp[index].open , close : resp[index].close , volume : resp[index].volume};
                    }
                }
                // complertem la ultima 
                lCandle = {dateUnix : resp[index].dateunix, low : resp[index].low , high : resp[index].high , open : resp[index].open , close : resp[index].close , volume : resp[index].volume};
                respuesta.push(lCandle);
                resolve (respuesta);
            });
        });
        /*
    } catch (e){
                console.log('error en getcandles : '+e);
      }
        */
    return (respuesta);
}








  sql = {};

  sql.conecta = conecta;
  sql.insertCandle = insertCandle;
  sql.getFirstLast = getFirstLast;
  sql.getCandles = getCandles;
  sql.getCountCandlesByDate = getCountCandlesByDate;
  sql.getLastDate = getLastDate;
  sql.desconecta = desconecta;
  sql.eliminaDups = eliminaDups;
  sql.buscaForats = buscaForats;
  module.exports = sql;
