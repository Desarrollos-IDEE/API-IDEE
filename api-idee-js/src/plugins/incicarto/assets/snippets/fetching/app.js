/* eslint-disable no-console */
console.log('Arranco2)');

postRequest.addEventListener('click', () => {
  const newPost = {
    title: 'A new Post',
    body: 'Lorem ipsum sec nector aldsjaljdf askdjaljd lksjdlakjdla',
    userId: 1,
  };

  console.log(newPost);
  console.log(JSON.stringify(newPost));

  fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    body: JSON.stringify(newPost),
    headers: {
      'Content-type': 'application/json',
    },
  }).then((res) => {
    return res.json();
  }).then((data) => {
    console.log(data);
  }).catch((error) => {
    console.log(error);
  });
});

/*
fetch('https://pokeapi.co/api/v2/pokemon/')
  .then((res) => {
    return res.json();
  })
  .then((data) => {
    console.log(data.results);
    data.results.forEach((element) => {
      console.log(element.name);
    });
  })
  .catch(error=>{
    console.log(error);
  }) */

/**
 * Async / await
 */
// Await funciona dentro de una función async
/* const getPokemones=async()=>{
  try{
    const respuesta = await fetch('https://pokeapi.co/api/v2/pokemon/');
    const data = await respuesta.json();
    console.log(data.results);

  }catch (error){
    console.log(error);
  }
}

getPokemones(); */
