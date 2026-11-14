#!/bin/sh

if [ "${MANDELBROT_ENV_SET:-}" = "1" ]; then
    return 0 2>/dev/null || exit 0
fi

# Run with ". ./setenv-mandelbrot.sh" from the directory containing this file.
GNUPLOT_HOME=/c/Apps/gnuplot
IMAGEMAGICK_HOME=/c/Apps/ImageMagick-6.9.1-2
FFMPEG_HOME=/c/Apps/ffmpeg
MANDELBROT_HOME=$(pwd -P)

PATH="$GNUPLOT_HOME/bin:$IMAGEMAGICK_HOME:$FFMPEG_HOME/bin:$MANDELBROT_HOME:$PATH"
MANDELBROT_ENV_SET=1

export GNUPLOT_HOME IMAGEMAGICK_HOME FFMPEG_HOME MANDELBROT_HOME PATH MANDELBROT_ENV_SET
