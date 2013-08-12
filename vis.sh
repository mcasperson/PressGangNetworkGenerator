cd /root/PressGangNetworkGenerator

# Remove the old files
mkdir /tmp/vis
rm /tmp/vis/*

# get the bugzilla details
psql -c "SELECT bug_id, bug_status, bug_severity, creation_ts, cf_build_id FROM BugzillaS.bugs WHERE bugs.cf_build_id LIKE '%-% __ ___ ____ __:__%'" -d EngVDBF -p 35432 -h vdb.engineering.redhat.com -U teiid -F"," -t -A > /tmp/vis/bugzilla.csv

# Generate the layout files and dump the text
node generate.js

# Generate the keywords
pushd /root/Maui1.2
java -cp "/root/Maui1.2/lib/*:/root/Maui1.2/bin" maui.main.MauiTopicExtractor -l /tmp/vis -m /root/Maui1.2/RedHat -f text
popd

# Generate the keyword graph
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
        if [ "$f" == "/tmp/vis/keywords.rsf" ]
        then    
                /usr/java/latest/bin/java -cp CCVisu.jar org.sosy_lab.ccvisu.CCVisu -i ${f} -outformat LAY -dim 3 > ${f}.lay
        else
                /usr/java/latest/bin/java -cp CCVisu.jar org.sosy_lab.ccvisu.CCVisu -vertRepu -i ${f} -outformat LAY -dim 3 > ${f}.lay
        fi
done

# copy the layouts
cp /tmp/vis/*.lay /var/www/html/visualizations/
cp /tmp/vis/extradata.js /var/www/html/visualizations/
cp /tmp/vis/*.rsf /var/www/html/visualizations/

