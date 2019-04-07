const express = require('express');
const app = express();
const sincronitza = require('./sincronitza.js');

function cbhttp(req,res){
    res.send('felicidades, conexion con express ok');
    res.end();
}

//app.get('/',function(req,res){cbhttp(req,res)});
app.use(express.static(__dirname ));
app.get('/ejemplojson', (req, res) => { // se suele poner abreviado
    res.send({
      nombre: 'Pepe',
      edad: 20,
      aficiones: [
        "cine",
        "pasear"
      ]
    });
})
app.post('/parametres',function(req,resp){
    console.log('parametres : '+req.body);
    resp.send('ok');
})

app.get('/sincronitza',(req,resp)=>{
    sincronitza.sincro();
    resp.send("ok sincro");
});  

app.listen(3001,()=>{console.log('servidor iniciado v 2.0');});

const sum = require('./modulMeu.js');
console.log('suma : ',2,3,sum.suma(2,3));
console.log('ara : ' + Date());
let valor = '';
/*sincronitza.test4().then((data)=>{
    console.log(data);
    valor = data;});
*/
sincronitza.sincronitza('GDAX','BTC-EUR');
console.log('the end');

return;