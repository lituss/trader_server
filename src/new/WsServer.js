const WebSocket = require('ws');

class WsClient {
    constructor(ws,trader){
        this.ws = ws;
        this.trader = trader;
        this.canals = [];
        ws.on('message',(data)=>this.receive(data));
    }

    async receive(data){
        try {
            data = JSON.parse(data);
            console.log('data: ',data);
            if(data.hasOwnProperty('tipus')){
                switch (data.tipus) {
                    case 'subscribe' :
                        this.canals.push(data.canal);
                        break;
                    case 'unsubscribe':
                        let posicio = this.canals.findIndex(data.canal);
                        if (posicio > -1)
                            this.canals.splice(posicio,1);
                        break;
                    case 'getPairsStatus':
                        console.log('reb missatge getPairStatus');
                        let missatge = {"tipus": "putPairsStatus", "data": await this.trader.sql.getPairs()};
                        //let missatge = {"tipus": "putPairsStatus"};
                        //missatge = JSON.stringify(missatge); 
                        console.log(missatge);
                        this.sendObj(missatge);
                    break;
                }
            }else
                console.log('Error en missatge, falta tipus');
    
        } catch (e){console.log("Error socket : ",e)}
    }
    sendObj(data){
        try{
            this.ws.send(JSON.stringify(data));
        } catch (e) { console.log('Error en envio socket ',e)}
    }
}


class WsServer{
    
    constructor(trader,url={port: 8083, format: 'json'} ){
        this.trader = trader;
        this.clients=[];
        //this.canals = [];
        this.wss = new WebSocket.Server(url);
        this.wss.on('connection',(ws)=>{this.connection(ws,trader)});
        
    }
    connection(ws,trader){
        console.log('nou ws client');
        this.clients.push(new WsClient(ws,trader));
        //ws.on('message',(data)=>{this.receive(data,ws)});
    }
    
    
    /*receive(data,ws){
        var aux = JSON.parse(data);
        if(aux.hasOwnProperty('tipus')){
            switch (aux.tipus){
                case 'id' :
                    let pos = this.clients.findIndex(valor=>valor === ws);
                    if (pos > -1) this.clients[pos].id = aux.id;
                    return {'tracta': false};

                case 'subscribe' : 
                    aux.subscribe.forEach(canal =>{
                        let pos = this.canals.findIndex(valor=>valor.nom ===canal);
                        if (pos > -1) this.canals[pos].sockets.push(ws);
                        else this.canals.push({'nom': canal,'sockets': [ws]});
                    });
                    return {'tracta': true, 'nousCanals': aux.subscribe};
                
                default:
                    return {'tracta': true};
            }
        }
        return {'tracta': true};
    }
*/
    send(data){
        data = JSON.parse(data);
        //console.log('entra a send ...');
        //console.log('test hasOwnProperty : '+data.hasOwnProperty('nom')+' , '+data.hasOwnProperty('canals'));
        if (data.hasOwnProperty('canals')){
            data.canals.forEach(canal=>{
                let subscriptors = this.clients.filter(canals.find(canal));
                if (subscriptors) 
                    subscriptors.forEach(s=>{
                        try{
                            s.ws.send(JSON.stringify(data));
                        }
                        catch (e){
                            console.error(e);
                        }        
                    });
            })
        }
        else throw 'Error , no se ha indicado el canal de envio';
        
       /* this.clients.forEach(d=>{
            try{
                d.socket.send(JSON.stringify(data));
            } catch (e){
                console.error(e);
                let pos = this.clients.findIndex(dd=>{
                    return dd === d});
                this.clients.splice(pos,1);
            }
        });*/
    }

}

module.exports = {WsServer};