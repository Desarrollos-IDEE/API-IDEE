#!/bin/bash

# Inicializa el archivo JSON con la estructura {"collection": []}
outputJSON="/docker/vis_com-apicnig/0_desarrollo_dockerCompose/vis_com-apicnig/webapps/api-core/WEB-INF/classes/resources_svg2.json"
echo '{"collection": []}' > "$outputJSON"

# Itera sobre cada carpeta proporcionada como parámetro
folderFather="/docker/vis_com-apicnig/0_desarrollo_dockerCompose/vis_com-apicnig/webapps/api-core/assets/svg/"
for folder in $(ls "$folderFather"); do
  # Crea una lista de todos los archivos de la carpeta actual
  files=$(ls "$folderFather/$folder")

  # Itera sobre cada archivo en la lista
  for file in $files; do
    # Obtiene la ruta absoluta del archivo
    file_path="https://componentes.cnig.es/api-core/assets/svg/$folder/$file"
    # Agrega un nuevo elemento a la matriz del archivo JSON con el nombre y la ruta del archivo
    jq --arg folder "$folder" --arg file "$file" --arg file_path "$file_path" \
    '.collection += [ {"name": $folder, "resource":[{"file":$file, "url": $file_path}]} ]' \
    "$outputJSON" > tmp.json && mv tmp.json "$outputJSON"

  done
done

# Muestra el archivo JSON resultante
cat "$outputJSON"
