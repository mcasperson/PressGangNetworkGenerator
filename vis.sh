cd /root/PressGangNetworkGenerator

# Remove the old files
mkdir /tmp/vis
rm /tmp/vis/*

# Generate the layout files and dump the text
node generate.js

java -cp "/root/Maui1.2/lib/*:/root/Maui1.2/bin" maui.main.MauiTopicExtractor -l /tmp/vis -m /root/Maui1.2/RedHat -f text

node generateKeywords.js

# Remove the backup files
rm /var/www/html/visualizations/backup/*
cp /var/www/html/visualizations/*.lay /var/www/html/visualizations/backup
cp /var/www/html/visualizations/extradata.js /var/www/html/visualizations/backup
cp /var/www/html/visualizations/*.rsf /var/www/html/visualizations/backup

# generate the layouts

for f in /tmp/vis/*.rsf
do
        echo Processing ${f}
        /usr/java/latest/bin/java -cp CCVisu.jar org.sosy_lab.ccvisu.CCVisu -vertRepu -i ${f} -outformat LAY -dim 3 > ${f}.lay
done

# copy the layouts
cp /tmp/vis/*.lay /var/www/html/visualizations/
cp /tmp/vis/extradata.js /var/www/html/visualizations/
cp /tmp/vis/*.rsf /var/www/html/visualizations/

