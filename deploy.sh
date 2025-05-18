echo installing dependencies

npm i

echo building
npm run build

echo delete old files
rm -rf /var/www/html/*

echo copying files
cp -r ./dist/* /var/www/html/

cp -r ./Backend/* "../MeshMetrics Backend/"

echo restarting backend service
echo "YOUR_PASSWORD" | sudo -S systemctl restart mesh_metrics.service
