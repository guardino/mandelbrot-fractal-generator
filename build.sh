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

./backend/mandelbrot/compile.sh

ng build
npm run start:server
