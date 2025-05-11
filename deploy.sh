echo installing dependencies

npm i

echo building
npm run build

echo delete old files
rm -rf /var/www/html/*

echo copying files
cp -r ./dist/* /var/www/html/

cp -r ./Backend/* "../MeshMetrics Backend/"

