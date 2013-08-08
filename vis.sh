cd /root/PressGangNetworkGenerator
rm /tmp/topics.rsf
rm /tmp/extradata.js
node index.html
rm /var/www/html/visualizations/topics.lay.old
rm /var/www/html/visualizations/extradata.js.old
rm /var/www/html/visualizations/topics.rsf.old
cp /var/www/html/visualizations/topics.lay /var/www/html/visualizations/topics.lay.old
cp /var/www/html/visualizations/extradata.js /var/www/html/visualizations/extradata.js.old
cp /var/www/html/visualizations/topics.rsf /var/www/html/visualizations/topics.rsf.old
/usr/java/latest/bin/java -cp CCVisu.jar org.sosy_lab.ccvisu.CCVisu -vertRepu -i /tmp/topics.rsf -outformat LAY -dim 3 > /tmp/topics.lay
cp /tmp/topics.lay /var/www/html/visualizations/
cp /tmp/extradata.js /var/www/html/visualizations/
cp /tmp/topics.rsf /var/www/html/visualizations/
