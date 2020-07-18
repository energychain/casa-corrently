#!/bin/bash

mkdir /opt
cd /opt

git clone https://github.com/energychain/casa.corrently.git

cd casa.corrently
chmod +x ./install.sh
chmod +x ./packages/nodejs_14,sh

./install.sh
