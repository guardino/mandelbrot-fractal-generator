#!/bin/sh

cd ~/
killall node
mv backend/images .
rm -rf backend
gzip -cd backend.tar.gz | tar xvf -
mv images backend

cd ~/backend/mandelbrot
make clean
make
mv mandelbrot.exe mandelbrot-64.exe

make clean
make REAL_LONG=1
mv mandelbrot.exe mandelbrot-80.exe

make clean
make REAL_QUAD=1
mv mandelbrot.exe mandelbrot-128.exe

cd ~/backend
npm install
MONGO_ATLAS_PW=MONGO_ATLAS_PW JWT_KEY=JWT_KEY node server.js &
