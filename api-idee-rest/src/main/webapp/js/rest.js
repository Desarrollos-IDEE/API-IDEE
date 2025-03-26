const search = document.getElementById("search");
const matchList = document.getElementById("match-list");
const matchObsolete = document.getElementById("match-list-obsolete");

const searchStates = async searchText =>{
  const res = await fetch("data/rest.json");
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

const createTemplate = (t) => { 
  return `
      <a class="col" style="padding-bottom:15px; color:black;" href="${t.url}" target="_blank">
        <div class="card shadow-sm h-100" style="background-color: rgba(240, 128, 128,0.15);">
          <h4 class="text-primary text-center pt-4 pr-2 pl-2">${t.name}</h4>
          <div class="card-body">
            <p class="card-text" style="min-height:100px;">${t.description}</p>
          </div>
        </div>
      </a>
  `;
};

const outputHTMLBootstrap = matches =>{
  if (matches.length > 0){
    let html = '';
    let htmlObsolete = '';

    matches.forEach(match => {
      const plugin = createTemplate(match);

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

// --
const CONTROLS = [
  {
    "name": "Control Attributions",
    "description": "Control Attributions",
    "url": "/api-idee/?controls=attributions"
},
{
  "name": "Control backgroundlayers",
  "description": "Control backgroundlayers",
  "url": "/api-idee/?controls=backgroundlayers"

},
{
    "name": "Control getfeatureinfo",
    "description": "Control getfeatureinfo",
    "url": "/api-idee/?layers=WMS*Unidad%20administrativa*http://www.ign.es/wms-inspire/unidades-administrativas?*AU.AdministrativeUnit*true*true**true*true*true*1.3.0&center=-1264453.9015709583,4323899.840546544&zoom=5&controls=getfeatureinfo"
},
{
    "name": "Control location",
    "description": "Control location",
    "url": "/api-idee/?controls=location"
},
{
    "name": "Control panzoom",
    "description": "Control panzoom",
    "url": "/api-idee/?controls=panzoom"
},
{
    "name": "Control panzoombar",
    "description": "Control panzoombar",
    "url": "/api-idee/?controls=panzoombar"
},
{
    "name": "Control rotate",
    "description": "Control rotate",
    "url": "/api-idee/?controls=rotate"
},
{
    "name": "Control scale",
    "description": "Control scale",
    "url": "/api-idee/?controls=scale"
},
{
    "name": "Control scaleline",
    "description": "Control scaleline",
    "url": "/api-idee/?controls=scaleline"
},
{
    "name": "Todos los controles",
    "description": "Todos los controles",
    "url": "/api-idee/?layers=QUICK*Base_IGNBaseTodo_TMS,WMS*Unidad%20administrativa*http://www.ign.es/wms-inspire/unidades-administrativas?*AU.AdministrativeUnit*true*true**true*true*true*1.3.0&center=-1264453.9015709583,4323899.840546544&zoom=5&controls=attributions,backgroundlayers,getfeatureinfo,location,panzoom,panzoombar,rotate,scale,scaleline"
},
]

const $containterControls = document.getElementById("match-list-controls");
$containterControls.innerHTML = CONTROLS.map(createTemplate).join("");
