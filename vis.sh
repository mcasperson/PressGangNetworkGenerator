cd /root/PressGangNetworkGenerator
rm /tmp/*.rsf
rm /tmp/*.lay
rm /tmp/extradata.js
node index.html
rm /var/www/html/visualizations/backup/*
cp /var/www/html/visualizations/*.lay /var/www/html/visualizations/backup
cp /var/www/html/visualizations/*.rsf /var/www/html/visualizations/backup
cp /var/www/html/visualizations/extradata.js /var/www/html/visualizations/backup
for f in /tmp/*.rsf; 
do
	echo "Processing ${f}"
	/usr/java/latest/bin/java -cp CCVisu.jar org.sosy_lab.ccvisu.CCVisu -vertRepu -i $f -outformat LAY -dim 3 > $f.lay 
done
cp /tmp/*.lay /var/www/html/visualizations/
cp /tmp/*.rsf /var/www/html/visualizations/
cp /tmp/extradata.js /var/www/html/visualizations/

