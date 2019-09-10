function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  /* exemple de us sleep : 
  async function demo() {
    console.log('Taking a break...');
    await sleep(2000);
    console.log('Two seconds later');
  }
  */
async function retornaValor(){
    await sleep(3000);
    return 'Promesa complerta';
}

  console.log('inici ...');
  //valor = retornaValor();
  //console.log('valor : '+ valor);
  prova();

  async function prova(){
      valor = await retornaValor();
      console.log('va lor : '+valor);
  }