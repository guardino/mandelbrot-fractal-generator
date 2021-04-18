#!/bin/sh

cd ${0%/*} || exit 1    # run from this directory

#npm install
rm -f backend.tar
rm -f backend.tar.gz
rm -rf backend/angular
#rm -rf backend/images
if [ ! -d backend/images ] ; then
    mkdir backend/images
fi

cd backend/mandelbrot

gmake clean
gmake
mv mandelbrot.exe mandelbrot-64.exe

gmake clean
gmake REAL_LONG=1
mv mandelbrot.exe mandelbrot-80.exe

gmake clean
gmake REAL_QUAD=1
mv mandelbrot.exe mandelbrot-128.exe

cd ../..
ng build
npm run start:server
