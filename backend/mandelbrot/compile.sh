#!/bin/sh

cd ${0%/*} || exit 1    # run from this directory

if [[ "$OSTYPE" == "msys" ]]; then
    MAKE_PRG="gmake"
    EXE_EXT=".exe"
else
    MAKE_PRG="make"
    EXE_EXT=""
fi

rm -f *.exe *.o
rm -f mandelbrot-* mandelbrot

$MAKE_PRG clean
$MAKE_PRG
mv mandelbrot$EXE_EXT mandelbrot-64$EXE_EXT

$MAKE_PRG clean
$MAKE_PRG REAL_LONG=1
mv mandelbrot$EXE_EXT mandelbrot-80$EXE_EXT

$MAKE_PRG clean
$MAKE_PRG REAL_QUAD=1
mv mandelbrot$EXE_EXT mandelbrot-128$EXE_EXT

rm -f *.o

ls -altr
