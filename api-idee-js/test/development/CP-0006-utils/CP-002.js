import { map as Mmap } from "IDEE/api-idee";
import  * as dialog from "IDEE/dialog";
import { get as remoteGet } from 'IDEE/util/Remote';
import { parseCRSWKTtoJSON } from 'IDEE/util/Utils';

const mapa = Mmap({
  container: "map",
  projection: "EPSG:3857",
});

window.mapa = mapa;

let url = "https://epsg.io/3857.wkt2"
remoteGet(url).then(function(res){
                dialog.info(JSON.stringify(parseCRSWKTtoJSON(res.text)));
                console.log(parseCRSWKTtoJSON(res.text))
              });

