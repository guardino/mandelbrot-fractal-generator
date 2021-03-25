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
rm -f mandelbrot.{o,exe}
gmake

ng build

cd ../..
npm run start:server
