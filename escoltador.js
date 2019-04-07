var restify = require('restify');
var sincronitza = require('./sincronitza.js');
var util = require('util');
var WebSocket = require('ws');



const server = restify.createServer({
  name: 'myapp',
  version: '1.0.0'
});

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser({mapParams: false}));

server.get('/echo/:name', function (req, res, next) {
  res.send(req.params);
  return next();
});

server.post('/pairs',async function(req,res,next){
  var aux = [];
  aux = await sincronitza.getGdaxPairs();
  console.log('retorn : '+JSON.stringify(aux));
  switch (req.body.exchange){
    case 'GDAX' :
      res.send(await sincronitza.getGdaxPairs());
      break;
  } 

return next(false)
}
);


server.post('/test', function (req,res,next){
//var aux = new multiplica(3,4);
//res.send(`valors : {$v1}`);
console.log('cridat ...');
console.log(req.toString());
console.log(JSON.stringify(req.body));
var method = req.method;
var params = req.params;
var query  = req.query;
var body   = req.body;


console.log("Method: " + method +
            "\nParams: " + util.inspect(params, false, null, true) +
            "\nQuery: " + util.inspect(query, false, null, true) +
            "\nBody: " + util.inspect(body, false, null, true) + "\n");
console.log('oper : '+body.operacio);

var operacio = new classes[body.operacio](body.parametres);
console.log('resultat : '+operacio.resposta());
  

//var parametres = JSON.parse(req.body); 
//console.log('parametres : '+JSON.stringify(parametres));
//console.log('parametres.operacio : '+parametres.operacio);
//var aux2 ={};
// aux2 = JSON.parse(req.params.v1);

//console.log(`valors : ${aux2.v1},${aux2.v2} `);
//console.log(' resultat : '+aux.resposta());
//res.send(`res : ${aux.resposta()}`);
//console.log('valors : '+req.params.v1);
res.send('crida rebuda');
return next(false);
});

class multiplica{
    
    constructor(parametres){
        this.res = parametres.v1*parametres.v2;

    }
    resposta(){return this.res}
    resposta2(){return ' prova 2 ok'}
}

class suma{
  constructor(a,b){
    this.res = a+b;

}
resposta(){return this.res}
}

var classes = {'multiplica': multiplica, 'suma':suma};

server.listen(8080, function () {
  console.log('%s listening at %s', server.name, server.url);
});









class myWS{
 
  constructor(){
    this.wss = new WebSocket.Server({port: 8082}); //server
    console.log('listening ws on 8082...');
    this.ws= [];  // conection
    this.wss.on('connection',(ws)=>{
      this.ws.push(ws);
      console.log('ws incomming conection');
      ws.on('message',(data)=>{this.processaMissatge(data,ws);})
    })
  }
  

  processaMissatge(missatge,ws){
    console.log('executant processaMissatge ...');
    //console.log(JSON.stringify(missatge));
    var lmissatge = JSON.parse(missatge); 
    console.log(missatge);
    switch (lmissatge.tipus){
      case 'sincro': 
      console.log('parametres sincro : '+JSON.stringify(lmissatge));
      sincronitza.sincronitza(lmissatge.exchange,lmissatge.pair,lmissatge.dataIni,
        lmissatge.dataFi,ws);
      break;
      case 'chat': 
      console.log('entra a chat');
        console.log(JSON.stringify(this.lmissatge));
        ws.send(JSON.stringify({tipus: 'chat',data: 'que tal ...'}));
    }
  }

}

var localWSS = new myWS();