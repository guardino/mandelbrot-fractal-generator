#!/bin/sh
cd images
gcc -O3 -o mandelbrot.exe mandelbrot.c
./mandelbrot.exe -h
sudo apt-get install -y gnuplot
gnuplot --version
