const mysql = require('mysql');
const util = require('util');
async function getCandles(exchange,pair,initialDate,endDate,granularity){
    let respuesta = [];
    var con;
    granularity = Number(granularity);
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
    console.log('parametres getCandles :: exchange,pair,initialDate,endDate,granularity :'+exchange+','+pair+','+new Date(initialDate).getTime()/1000+','+new Date(endDate).getTime()/1000+','+granularity);
    let sentencia = 'select * from candles where exchange = ? and pair = ? and dateunix between  ? and ? order by dateunix;';
        try{
            resp =  await query(sentencia,[exchange,pair,new Date(initialDate).getTime()/1000,new Date(endDate).getTime()/1000]);
        } catch (err){
                console.log('error en sentencia sql : '+err);
        }    
                
                var index;
                console.log('candles : '+resp.length+'initialDate : '+initialDate);
                if (resp.length == 0){console.log ('sqlGetCandles : ' + sentencia + 'sin resultados');throw 'Sin resultados';}
                let lCandle = {dateUnix : resp[0].dateunix, low : resp[0].low , high : resp[0].high , open : resp[0].open , close : resp[0].close , volume : resp[0].volume};
                let limit = Date.parse(initialDate)/1000 + granularity;
                //console.log('limit init + gran : '+ Date.parse(initialDate)/1000 +' , '+granularity);
                for (index = 1 ; index < resp.length ; index++){
                    //console.log('resp['+index+'] = '+resp[index].dateunix);
                    if (resp[index].dateunix < limit){
                        if (resp[index].low < lCandle.low) lCandle.low = resp[index].low;
                        if (resp[index].high > lCandle.high) lCandle.high = resp[index].high;
                        lCandle.volume+=resp[index].volume;
                    }
                    else {
                        lCandle.close = resp[index].close;
                        respuesta.push(lCandle);
                        // iniciem seguent candle
                        lCandle = {dateUnix : resp[index].dateunix, low : resp[index].low , high : resp[index].high , open : resp[index].open , close : resp[index].close , volume : resp[index].volume};
                        limit = resp[index].dateunix + granularity;
                    }
                }
                // complertem la ultima 
                console.log('index : '+index);
                lCandle = {dateUnix : resp[index - 1].dateunix, low : resp[index - 1].low , high : resp[index - 1].high , open : resp[index - 1].open , close : resp[index - 1].close , volume : resp[index - 1].volume};
                respuesta.push(lCandle);
                //console.log('respuesta candles : '+JSON.stringify(respuesta));
            
        /*
    } catch (e){
                console.log('error en getcandles : '+e);
      }
        */
    //console.log('respuesta : '+respuesta);   
    return (respuesta);
}

//const sql2 = {};
//sql2.getCandles = getCandles;
exports.getCandles = getCandles ;