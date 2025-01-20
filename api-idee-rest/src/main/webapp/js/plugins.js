const search = document.getElementById("search");
const matchList = document.getElementById("match-list");
const matchObsolete = document.getElementById("match-list-obsolete");

const searchStates = async searchText =>{
  const res = await fetch("data/plugins.json");
  const states = await res.json();

  //Get matches to current text input
  let matches = states.filter(state =>{

    const regex = new RegExp(removeDiacritics(`${searchText}`),'gi');
    return regex.test(removeDiacritics(state.name)) || regex.test(removeDiacritics(state.description))
   
  })

  if (searchText.length ===0){
    searchStates("a");
  }
  if (matches.length ===0){
    matches = [];
    matchList.innerHTML='';
  }

  outputHTMLBootstrap(matches);

}


const outputHTMLTailWind = matches =>{
  if (matches.length > 0){

    const html = matches.map( match => `
      <div class="bg-blue-100 rounded overflow-hidden shadow-md relative hover:shadow-lg">
        <img src="${match.image}" class="w-full h-32 object-cover">
        <div class="m-4">
          <span class="font-bold">${match.name}</span>
          <p>${match.description}</p>
          <div class="flex justify-center md:justify-end">
            <a  href="./json/codigosngbe" target="_blank" 
                class="bg-blue-300 rounded-full mt-3 py-2 px-3 uppercase text-xs font-bold cursor-pointer tracking-wider border-primary hover:bg-blue-400">Consulta</a>
          </div>
        </div>
        <div class="bg-gray-100 text-secondary-200 text-xs font-bold rounded-full p-2 absolute top-0 ml-2 mt-2">
            <div>        
              <span class="rounded-full">JSON</span>
            </div>
        </div>
      </div>
    `).join('');
    matchList.innerHTML = html;
  }
}


const outputHTMLBootstrap = matches =>{
  if (matches.length > 0){
    let html = '';
    let htmlObsolete = '';

    matches.forEach(match => {
      const plugin = `
      <div class="col" style="padding-bottom:15px;">
        <div class="card shadow-sm h-100" style="background-color: rgba(240, 128, 128,0.15);">
          <!--<img class="img-fluid" src="${match.image}">-->
          <h4 class="text-primary text-center pt-2">${match.plugin}</h4>
          <div class="card-body">
            <h5 class="card-title">${match.name}</h5>
            <p class="card-text" style="min-height:100px;">${match.description}</p>
            <div class="d-flex justify-content-between align-items-center">
              <div class="btn-group">
                <a href="${match.url_es}" class="btn btn-sm btn-outline-secondary" role="button" target="_blank" data-bs-toggle="button"><img style="width:24px;" src="img/spain-flag.svg"></a>
                <a href="${match.url_en}" class="btn btn-sm btn-outline-secondary" role="button" target="_blank" data-bs-toggle="button"><img style="width:24px;" src="img/uk-flag.svg"></a>
                <a href="${match.url_git}" class="btn btn-sm btn-outline-secondary" role="button" target="_blank" data-bs-toggle="button"><img style="width:24px;" src="img/logo-github.svg"></a>
              </div>
              <small class="text-muted">${match.version}</small>
            </div>
          </div>
        </div>
      </div>
      `;

      if (match.obsolete){
        htmlObsolete += plugin;
      }else{
        html += plugin;
      }
    });
    matchList.innerHTML = html;
    matchObsolete.innerHTML = htmlObsolete;
  }
}

search.addEventListener("input",()=>searchStates(search.value));


searchStates("a");