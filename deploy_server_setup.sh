#!/bin/sh

sudo apt-get update -y
sudo apt-get install -y gnuplot
gnuplot --version

sudo apt install gcc
gcc --version

sudo apt install nodejs
node --version

sudo apt install npm
npm --version
