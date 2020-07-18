#/bin/bash

apt-get update && apt-get upgrade -y && apt full-upgrade -y

# Install Node JS
cd packages
./nodejs_14.sh

apt install -y nodejs

# Install Zerotier
curl -s https://install.zerotier.com/ | /bin/bash
zerotier-cli join 1d71939404f950a4

# Install Node-Red
bash <(curl -sL https://raw.githubusercontent.com/node-red/linux-installers/master/deb/update-nodejs-and-nodered)
systemctl enable nodered.service

# Install Influxdb
wget -qO- https://repos.influxdata.com/influxdb.key | sudo apt-key add -
source /etc/os-release
echo "deb https://repos.influxdata.com/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/influxdb.list

apt update &&  apt install -y influxdb

sudo systemctl unmask influxdb.service
sudo systemctl start influxdb
sudo systemctl enable influxdb.service

influx -execute "create database casa"
influx -database "casa" -execute "create user casa with password 'corrently' with all privileges"
influx -database "casa" -execute "grant all privileges on casa to casa"

# Install Grafana
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee /etc/apt/sources.list.d/grafana.list

sudo apt update && sudo apt install -y grafana

sudo systemctl unmask grafana-server.service
sudo systemctl start grafana-server
sudo systemctl enable grafana-server.service
