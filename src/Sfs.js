const fs = require('fs');
const path = require('path');

class Sfs{
    constructor(nomFitxer,tipus,socket,canals){
       // this.readFileAsync = promisify(fs.readFile);
       // this.writeFileAsync = promisify(fs.writeFile);
       // this.appendFileAsync = promisify(fs.appendFileSync appendFile);
        this.nomFitxer = nomFitxer;
        this.tipus = tipus;
        this.socket = socket;
        this.canals = canals;
        console.log('path resolve : '+ path.resolve(nomFitxer));
    }
    rf(){
        try{
            //data = await this.readFileAsync(this.nomFitxer);
            let aux = fs.readFileSync(this.nomFitxer);
            let data = JSON.parse(aux);
            return data;
        } catch (e) {console.log('Error en lectura sincrona de fichero '+this.nomFitxer+' : '+e)}
        
    }
    wf(data){
        try{
            fs.writeFileSync(this.nomFitxer,JSON.stringify(data));
            let newData = {};
            if (data instanceof Array) newData.array = data;
            else
                for (var component in data) newData[component] = data[component];
            newData.canals = this.canals;
            newData.nom = this.nomFitxer;
            //newData.data = data;
            this.socket.send(JSON.stringify(newData));
            return;
        } catch (e){
            console.log('Error en escritura sincrona '+this.nomFitxer+' : '+e);
        }
    }
    af(data){
        try{
            fs.appendFileSync(this.nomFitxer,JSON.stringify(data));
            data.canals = this.canals;
            data.nom = this.nomFitxer;
            this.socket.send(JSON.stringify(data));
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
        }*/
    }
}
module.exports = {Sfs}