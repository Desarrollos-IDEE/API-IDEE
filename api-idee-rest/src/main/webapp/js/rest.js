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
    "url": "https://componentes.idee.es/api-idee/?layers=WMS*Unidad%20administrativa*http://www.ign.es/wms-inspire/unidades-administrativas?*AU.AdministrativeUnit*true*true**true*true*true*1.3.0&center=-1264453.9015709583,4323899.840546544&zoom=5&controls=attributions"
},
{
  "name": "Control backgroundlayers",
  "description": "Control backgroundlayers",
  "url": "https://componentes.idee.es/api-idee/?layers=WMS*Unidad%20administrativa*http://www.ign.es/wms-inspire/unidades-administrativas?*AU.AdministrativeUnit*true*true**true*true*true*1.3.0&center=-1264453.9015709583,4323899.840546544&zoom=5&controls=backgroundlayers"

},
{
    "name": "Control getfeatureinfo",
    "description": "Control getfeatureinfo",
    "url": "https://componentes.idee.es/api-idee/?layers=WMS*Unidad%20administrativa*http://www.ign.es/wms-inspire/unidades-administrativas?*AU.AdministrativeUnit*true*true**true*true*true*1.3.0&center=-1264453.9015709583,4323899.840546544&zoom=5&controls=getfeatureinfo"
},
{
    "name": "Control location",
    "description": "Control location",
    "url": "https://componentes.idee.es/api-idee/?layers=WMS*Unidad%20administrativa*http://www.ign.es/wms-inspire/unidades-administrativas?*AU.AdministrativeUnit*true*true**true*true*true*1.3.0&center=-1264453.9015709583,4323899.840546544&zoom=5&controls=location"
},
{
    "name": "Control panzoom",
    "description": "Control panzoom",
    "url": "https://componentes.idee.es/api-idee/?layers=WMS*Unidad%20administrativa*http://www.ign.es/wms-inspire/unidades-administrativas?*AU.AdministrativeUnit*true*true**true*true*true*1.3.0&center=-1264453.9015709583,4323899.840546544&zoom=5&controls=panzoom"
},
{
    "name": "Control panzoombar",
    "description": "Control panzoombar",
    "url": "https://componentes.idee.es/api-idee/?layers=WMS*Unidad%20administrativa*http://www.ign.es/wms-inspire/unidades-administrativas?*AU.AdministrativeUnit*true*true**true*true*true*1.3.0&center=-1264453.9015709583,4323899.840546544&zoom=5&controls=panzoombar"
},
{
    "name": "Control rotate",
    "description": "Control rotate",
    "url": "https://componentes.idee.es/api-idee/?layers=WMS*Unidad%20administrativa*http://www.ign.es/wms-inspire/unidades-administrativas?*AU.AdministrativeUnit*true*true**true*true*true*1.3.0&center=-1264453.9015709583,4323899.840546544&zoom=5&controls=rotate"
},
{
    "name": "Control scale",
    "description": "Control scale",
    "url": "https://componentes.idee.es/api-idee/?layers=WMS*Unidad%20administrativa*http://www.ign.es/wms-inspire/unidades-administrativas?*AU.AdministrativeUnit*true*true**true*true*true*1.3.0&center=-1264453.9015709583,4323899.840546544&zoom=5&controls=scale"
},
{
    "name": "Control scaleline",
    "description": "Control scaleline",
    "url": "https://componentes.idee.es/api-idee/?layers=WMS*Unidad%20administrativa*http://www.ign.es/wms-inspire/unidades-administrativas?*AU.AdministrativeUnit*true*true**true*true*true*1.3.0&center=-1264453.9015709583,4323899.840546544&zoom=5&controls=scaleline"
},
{
    "name": "Todos los controles",
    "description": "Todos los controles",
    "url": "https://componentes.idee.es/api-idee/?layers=WMS*Unidad%20administrativa*http://www.ign.es/wms-inspire/unidades-administrativas?*AU.AdministrativeUnit*true*true**true*true*true*1.3.0&center=-1264453.9015709583,4323899.840546544&zoom=5&controls=attributions,backgroundlayers,getfeatureinfo,location,panzoom,panzoombar,rotate,scale,scaleline"
},
]

const $containterControls = document.getElementById("match-list-controls");
$containterControls.innerHTML = CONTROLS.map(createTemplate).join("");

// --
const PLUGINS = [
  {
    "name": "Plugin backimglayer",
    "description": "Plugin backimglayer",
    "url": "https://componentes.idee.es/api-idee/?backimglayer"
},
{
    "name": "Plugin comparators",
    "description": "Plugin comparators",
    "url": "https://componentes.idee.es/api-idee/?comparators"
},
{
    "name": "Plugin contactlink",
    "description": "Plugin contactlink",
    "url": "https://componentes.idee.es/api-idee/?contactlink"
},
{
    "name": "Plugin help",
    "description": "Plugin help",
    "url": "https://componentes.idee.es/api-idee/?help"
},
{
    "name": "Plugin incicarto",
    "description": "Plugin incicarto",
    "url": "https://componentes.idee.es/api-idee/?incicarto"
},
{
    "name": "Plugin infocoordinates",
    "description": "Plugin infocoordinates",
    "url": "https://componentes.idee.es/api-idee/?infocoordinates"
},
{
    "name": "Plugin information",
    "description": "Plugin information",
    "url": "https://componentes.idee.es/api-idee/?information"
},
{
    "name": "Plugin layerswitcher",
    "description": "Plugin layerswitcher",
    "url": "https://componentes.idee.es/api-idee/?layerswitcher"
},
{
    "name": "Plugin locator",
    "description": "Plugin locator",
    "url": "https://componentes.idee.es/api-idee/?locator"
},
{
    "name": "Plugin locatorscn",
    "description": "Plugin locatorscn",
    "url": "https://componentes.idee.es/api-idee/?locatorscn"
},
{
    "name": "Plugin measurebar",
    "description": "Plugin measurebar",
    "url": "https://componentes.idee.es/api-idee/?measurebar"
},
{
    "name": "Plugin modal",
    "description": "Plugin modal",
    "url": "https://componentes.idee.es/api-idee/?modal"
},
{
    "name": "Plugin mousesrs",
    "description": "Plugin mousesrs",
    "url": "https://componentes.idee.es/api-idee/?mousesrs"
},
{
    "name": "Plugin overviewmap",
    "description": "Plugin overviewmap",
    "url": "https://componentes.idee.es/api-idee/?overviewmap"
},
{
    "name": "Plugin printviewmanagement",
    "description": "Plugin printviewmanagement",
    "url": "https://componentes.idee.es/api-idee/?printviewmanagement"
},
{
    "name": "Plugin queryattributes",
    "description": "Plugin queryattributes",
    "url": "https://componentes.idee.es/api-idee/?queryattributes"
},
{
    "name": "Plugin rescale",
    "description": "Plugin rescale",
    "url": "https://componentes.idee.es/api-idee/?rescale"
},
{
    "name": "Plugin selectionzoom",
    "description": "Plugin selectionzoom",
    "url": "https://componentes.idee.es/api-idee/?selectionzoom"
},
{
    "name": "Plugin sharemap",
    "description": "Plugin sharemap",
    "url": "https://componentes.idee.es/api-idee/?sharemap"
},
{
    "name": "Plugin storymap",
    "description": "Plugin storymap",
    "url": "https://componentes.idee.es/api-idee/?storymap"
},
{
    "name": "Plugin stylemanager",
    "description": "Plugin stylemanager",
    "url": "https://componentes.idee.es/api-idee/?stylemanager"
},
{
    "name": "Plugin timeline",
    "description": "Plugin timeline",
    "url": "https://componentes.idee.es/api-idee/?timeline"
},
{
    "name": "Plugin vectorsmanagement",
    "description": "Plugin vectorsmanagement",
    "url": "https://componentes.idee.es/api-idee/?vectorsmanagement"
},
{
    "name": "Plugin viewmanagement",
    "description": "Plugin viewmanagement",
    "url": "https://componentes.idee.es/api-idee/?viewmanagement"
},
{
    "name": "Todos los plugins",
    "description": "Todos los plugins",
    "url": "https://componentes.idee.es/api-idee/?plugins=backimglayer,comparators,contactlink,help,incicarto,infocoordinates,information,layerswitcher,locator,locatorscn,measurebar,modal,mousesrs,overviewmap,printviewmanagement,queryattributes,rescale,selectionzoom,sharemap,storymap,stylemanager,timeline,vectorsmanagement,viewmanagement"
}
];

const $containterPlugins = document.getElementById("match-list-plugins");
$containterPlugins.innerHTML = PLUGINS.map(createTemplate).join("");
