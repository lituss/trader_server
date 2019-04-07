const WebSocket = require('ws');
class WsServer{
    
    constructor(url={port: 8083}){
        this.clients=[];
        this.canals = [];
        this.wss = new WebSocket.Server(url);
        this.wss.on('connection',(ws)=>{this.connection(ws)});
        
    }
    connection(ws){
        console.log('nou ws client');
        this.clients.push({'socket': ws,'id': null});
        ws.on('message',(data)=>{this.receive(data,ws)});
    }
    
    receive(data,ws){
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

    send(data){
        data = JSON.parse(data);
        //console.log('entra a send ...');
        //console.log('test hasOwnProperty : '+data.hasOwnProperty('nom')+' , '+data.hasOwnProperty('canals'));
        if (data.hasOwnProperty('canals')){
            data.canals.forEach(canal=>{
                let subscriptors = this.canals.find(c=>c.nom === canal);
                if (subscriptors) 
                    subscriptors.sockets.forEach(s=>{
                        try{
                            s.send(JSON.stringify(data));
                        }
                        catch (e){
                            console.error(e);
                            let pos = this.clients.findIndex(dd=>{
                                return dd.socket === s});
                            this.clients.splice(pos,1);
                            this.canals.forEach(auxCanal=>{
                                let auxPos = auxCanal.sockets.findIndex((auxSocket=>auxSocket === s));
                                if (auxPos > -1) auxCanal.sockets.splice(auxPos,1);
                            });
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