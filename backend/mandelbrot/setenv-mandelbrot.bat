@echo off
rem #####################################################################################
rem Name:          setenv-mandelbrot.bat
rem Description:   Environment setup script for use with Windows CMD prompt shells
rem Author:        Cesare Guardino
rem Last modified: 2 January 2024
rem #####################################################################################

if defined MANDELBROT_ENV_SET goto :eof

rem =========== USER EDITABLE SETTINGS ===========
set GNUPLOT_HOME=C:\Apps\gnuplot
set IMAGEMAGICK_HOME=C:\Apps\ImageMagick-6.9.1-2
set FFMPEG_HOME=C:\Apps\ffmpeg
rem ==============================================

if defined GNUPLOT_HOME set PATH=%GNUPLOT_HOME%\bin;%PATH%
if defined IMAGEMAGICK_HOME set PATH=%IMAGEMAGICK_HOME%;%PATH%
if defined FFMPEG_HOME set PATH=%FFMPEG_HOME%\bin;%PATH%
set PATH=%~dp0;%PATH%
set MANDELBROT_ENV_SET=1
