#!/bin/sh

cd ~/
killall node
mv backend/images .
rm -rf backend
gzip -cd backend.tar.gz | tar xvf -
mv images backend

./backend/mandelbrot/compile.sh

cd ~/backend
npm install
MONGO_ATLAS_PW=MONGO_ATLAS_PW JWT_KEY=JWT_KEY node server.js &
