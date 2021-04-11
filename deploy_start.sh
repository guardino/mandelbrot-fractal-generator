#!/bin/sh

cd ~/
killall node
mv backend/images .
rm -rf backend
gzip -cd backend.tar.gz | tar xvf -
mv images backend

cd ~/backend/mandelbrot
make clean
make -f Makefile_linux

cd ~/backend
npm install
MONGO_ATLAS_PW=MONGO_ATLAS_PW JWT_KEY=JWT_KEY node server.js &
