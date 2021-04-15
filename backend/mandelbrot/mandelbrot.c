/*
    Name:            mandelbrot.c
    Description:     Mandelbrot set generation code
    Author:          Cesare Guardino
    First version:   May 16 2018
*/

#include <ctype.h>      /* toupper */
#include <stdio.h>
#include <stdlib.h>     /* atoi */
#include <string.h>     /* strlen */
#include "data_types.h"

#ifdef REAL_QUAD
    #include <quadmath.h>
#endif

#define CONTOUR_LEVELS 64
#define COLOR_THEME 3
#define MAX_ITERATIONS 2048
#define MAX_PIXELS 1024
#define FRACTAL_TYPE 1

struct cpoint {
    REAL x0, y0;
    unsigned int iter;
};

struct cregion {
    struct cpoint A, B;
};

struct sregion {
    unsigned int nPx, nPy;
};

struct cpoint *scanPoints(const struct cregion domain, const struct sregion screen, unsigned int maxIterations);
struct cpoint *scanJuliaPoints(const struct cregion domain, const struct sregion screen, unsigned int maxIterations, const struct cpoint C);
FILE *outputPoints(char *fileName, const struct cpoint *cpoints, const struct cregion domain, const struct sregion screen, unsigned int contourLevels);
FILE *printPointsInSet(char *fileName, const struct cpoint *cpoints, const struct sregion screen, unsigned int maxIterations, char symbol);
FILE *createGnuplotScipt(char *fileName, unsigned int contourLevels, unsigned int width, unsigned int height, unsigned int colorTheme);
char *getRGBFormula(unsigned int colorTheme);

int main(int argc, char *argv[])
{
    unsigned int maxPixels = MAX_PIXELS;
    unsigned int contourLevels = CONTOUR_LEVELS;
    unsigned int colorTheme = COLOR_THEME;
    unsigned int maxIterations = MAX_ITERATIONS;
    unsigned int fractalType = FRACTAL_TYPE;
    unsigned int nPx;
    unsigned int nPy;
    REAL xMin = -2.5, xMax = 1.0, yMin = -1.3, yMax = 1.3;
    REAL xC = 0.0, yC = 0.0;

    int c;
    while (--argc > 6 && (*++argv)[0] == '-')
        while ((c = *++argv[0]) && !isdigit(c))
            switch (c) {
            case 'c':
                contourLevels = atoi(*++argv);
                --argc;
                break;
            case 'f':
                fractalType = atoi(*++argv);
                --argc;
                break;
            case 'i':
                maxIterations = atoi(*++argv);
                --argc;
                break;
            case 's':
                maxPixels = atoi(*++argv);
                --argc;
                break;
            case 't':
                colorTheme = atoi(*++argv);
                --argc;
                break;
            default:
                printf("mandelbrot: illegal option %c\n", c);
                argc = -1;
                break;
            }

    if (argc < 4) {
        printf("Usage: mandelbrot [-c contours] [-f fractal] [-i iterations] [-s size] [-t theme] [x_min x_max y_min y_max]\n");
        printf("Examples:\n");
        printf("    Mandelbrot Set: mandelbrot -c 64 -f 1 -i 2048 -s 1024 -t 3 -2.5 1.0 -1.3 1.3 0.0 0.0\n");
        printf("    Julia Set:      mandelbrot -c 64 -f 2 -i 2048 -s 1024 -t 3 -1.5 1.5 -1.5 1.5 0.45 0.1428\n");
        return 1;
    }

    if (argc >= 4)
    {
        #ifdef REAL_QUAD
            xMin = strtoflt128(*++argv, NULL);
            xMax = strtoflt128(*++argv, NULL);
            yMin = strtoflt128(*++argv, NULL);
            yMax = strtoflt128(*++argv, NULL);
        #else
            #ifdef REAL_LONG
                xMin = strtold(*++argv, NULL);
                xMax = strtold(*++argv, NULL);
                yMin = strtold(*++argv, NULL);
                yMax = strtold(*++argv, NULL);
            #else
                xMin = atof(*++argv);
                xMax = atof(*++argv);
                yMin = atof(*++argv);
                yMax = atof(*++argv);
            #endif  // REAL_LONG
        #endif  // REAL_QUAD
    }

    if (argc == 6 && fractalType == 2)
    {
        #ifdef REAL_QUAD
            xC = strtoflt128(*++argv, NULL);
            yC = strtoflt128(*++argv, NULL);
        #else
            #ifdef REAL_LONG
                xC = strtold(*++argv, NULL);
                yC = strtold(*++argv, NULL);
            #else
                xC = atof(*++argv);
                yC = atof(*++argv);
            #endif  // REAL_LONG
        #endif  // REAL_QUAD
    }

    if (yMax - yMin > xMax - xMin)
    {
        nPx = (xMax - xMin) * maxPixels / (yMax - yMin);
        nPy = maxPixels;
    }
    else
    {
        nPx = maxPixels;
        nPy = (yMax - yMin) * maxPixels / (xMax - xMin);
    }

    struct cpoint A = { xMin, yMin, 0 };
    struct cpoint B = { xMax, yMax, 0 };
    struct cpoint C = { xC, yC, 0 };
    struct cregion domain = { A, B };
    struct sregion screen = { nPx, nPy };

    struct cpoint *cpoints = (fractalType == 2) ? scanJuliaPoints(domain, screen, maxIterations, C) : scanPoints(domain, screen, maxIterations);

    #ifdef _WIN32
        system("cmd.exe /c del /F/Q contours.* mandelbrot.txt > NUL 2>&1");
    #else
        system("rm -f contours.* mandelbrot.txt > /dev/null 2>&1");
    #endif

    if (cpoints == NULL) {
        printf("mandelbrot: error in calculating points");
        return 2;
    }

    outputPoints("contours.csv", cpoints, domain, screen, contourLevels);
    if (colorTheme == 0) {
        printPointsInSet("mandelbrot.txt", cpoints, screen, maxIterations, '*');
    }

    free(cpoints);

    if (colorTheme > 0 && createGnuplotScipt("contours.plt", contourLevels, nPx, nPy, colorTheme) != NULL)
    {
        system("gnuplot < contours.plt");
        //system("ps2pdf contours.ps");
        //system("contours.pdf");
    }
}

struct cpoint *scanPoints(const struct cregion domain, const struct sregion screen, unsigned int maxIterations)
{
    struct cpoint *cpoints = malloc(screen.nPx * screen.nPy * sizeof(struct cpoint));

    REAL deltaX = (domain.B.x0 - domain.A.x0) / screen.nPx;
    REAL deltaY = (domain.B.y0 - domain.A.y0) / screen.nPy;

    //For each pixel (Px, Py) on the screen, do:
    struct cpoint *ptr = cpoints;
    for (int j = 0; j < screen.nPy; j++)
    {
        for (int i = 0; i < screen.nPx; i++)
        {
            //x0 = scaled x coordinate of pixel (scaled to lie in the Mandelbrot x scale)
            //y0 = scaled y coordinate of pixel (scaled to lie in the Mandelbrot y scale)
            REAL x0 = domain.A.x0 + deltaX*i;
            REAL y0 = domain.A.y0 + deltaY*j;

            REAL x = 0.0;
            REAL y = 0.0;
            unsigned int iteration = 0;
            while (x*x + y*y < 4 && iteration < maxIterations)
            {
                REAL xTemp = x*x - y*y + x0;
                y = 2*x*y + y0;
                x = xTemp;
                iteration++;
            }

            struct cpoint p = { x0, y0, iteration };
            *ptr++ = p;
        }
    }

    return cpoints;
}

struct cpoint *scanJuliaPoints(const struct cregion domain, const struct sregion screen, unsigned int maxIterations, const struct cpoint C)
{
    struct cpoint *cpoints = malloc(screen.nPx * screen.nPy * sizeof(struct cpoint));

    REAL deltaX = (domain.B.x0 - domain.A.x0) / screen.nPx;
    REAL deltaY = (domain.B.y0 - domain.A.y0) / screen.nPy;

    //For each pixel (Px, Py) on the screen, do:
    struct cpoint *ptr = cpoints;
    for (int j = 0; j < screen.nPy; j++)
    {
        for (int i = 0; i < screen.nPx; i++)
        {
            //x0 = scaled x coordinate of pixel (scaled to lie in the Mandelbrot x scale)
            //y0 = scaled y coordinate of pixel (scaled to lie in the Mandelbrot y scale)
            REAL x0 = domain.A.x0 + deltaX*i;
            REAL y0 = domain.A.y0 + deltaY*j;

            REAL x = x0;
            REAL y = y0;
            unsigned int iteration = 0;
            while (x*x + y*y < 4 && iteration < maxIterations)
            {
                REAL xTemp = x*x - y*y + C.x0;
                y = 2*x*y + C.y0;
                x = xTemp;
                iteration++;
            }

            struct cpoint p = { x0, y0, iteration };
            *ptr++ = p;
        }
    }

    return cpoints;
}

FILE *outputPoints(char *fileName, const struct cpoint *cpoints, const struct cregion domain, const struct sregion screen, unsigned int contourLevels)
{
    FILE *fp;
    if ((fp = fopen(fileName, "w")) == NULL) {
        printf("mandelbrot: can't open %s\n", fileName);
        return NULL;
    }

    REAL factor = 1.0 / (domain.B.x0 - domain.A.x0);

    #ifdef REAL_QUAD
        int prec = 34;
        unsigned int n = 128;
        char x_str[n];
        char y_str[n];
    #endif

    for (int j = 0; j < screen.nPy; j++)
    {
        for (int i = 0; i < screen.nPx; i++)
        {
            #ifdef REAL_QUAD
                quadmath_snprintf(x_str, n + 1, "%36.*Qf", prec, (cpoints->x0 - domain.A.x0) * factor);
                quadmath_snprintf(y_str, n + 1, "%36.*Qf", prec, (cpoints->y0 - domain.A.y0) * factor);
                fprintf(fp, "%s, %s, %d\n", x_str, y_str, (cpoints->iter)%contourLevels);
            #else
                #ifdef REAL_LONG
                    fprintf(fp, "%.21Lf, %.21Lf, %d\n", (cpoints->x0 - domain.A.x0) * factor, (cpoints->y0 - domain.A.y0) * factor, (cpoints->iter)%contourLevels);
                #else
                    fprintf(fp, "%.17g, %.17g, %d\n", cpoints->x0, cpoints->y0, (cpoints->iter)%contourLevels);
                #endif  // REAL_LONG
            #endif  // REAL_QUAD

            cpoints++;
        }

        fprintf(fp, "\n");
    }

    fclose(fp);
}

FILE *printPointsInSet(char *fileName, const struct cpoint *cpoints, const struct sregion screen, unsigned int maxIterations, char symbol)
{
    FILE *fp;
    if ((fp = fopen(fileName, "w")) == NULL) {
        printf("mandelbrot: can't open %s\n", fileName);
        return NULL;
    }

    for (int j = 0; j < screen.nPy; j++)
    {
        for (int i = 0; i < screen.nPx; i++)
        {
            fprintf(fp, "%c", (cpoints->iter) == maxIterations ? symbol : ' ');
            cpoints++;
        }

        fprintf(fp, "\n");
    }

    fclose(fp);
}

FILE *createGnuplotScipt(char *fileName, unsigned int contourLevels, unsigned int width, unsigned int height, unsigned int colorTheme)
{
    FILE *fp;
    if ((fp = fopen(fileName, "w")) == NULL) {
        printf("mandelbrot: can't open %s\n", fileName);
        return NULL;
    }

    fprintf(fp, "reset\n");
    fprintf(fp, "\n");
    fprintf(fp, "unset key\n");
    fprintf(fp, "unset grid\n");
    fprintf(fp, "unset xzeroaxis\n");
    fprintf(fp, "unset yzeroaxis\n");
    fprintf(fp, "unset xtics\n");
    fprintf(fp, "unset ytics\n");
    fprintf(fp, "unset border\n");
    fprintf(fp, "unset surface\n");
    fprintf(fp, "unset colorbox\n");
    fprintf(fp, "\n");
    fprintf(fp, "set contour base\n");
    fprintf(fp, "set view map\n");
    fprintf(fp, "set cntrparam levels %d\n", contourLevels);
    fprintf(fp, "set palette rgbformulae %s\n", getRGBFormula(colorTheme));
    fprintf(fp, "\n");
    fprintf(fp, "set size ratio -1\n");
    fprintf(fp, "set lmargin at screen 0\n");
    fprintf(fp, "set rmargin at screen 1\n");
    fprintf(fp, "set tmargin at screen 0\n");
    fprintf(fp, "set bmargin at screen 1\n");
    fprintf(fp, "set terminal png size %d,%d\n", width, height);
    fprintf(fp, "set output 'contours.png'\n");
    fprintf(fp, "splot 'contours.csv' u 1:2:3 w image\n");
    fclose(fp);

    return fp;
}

char *getRGBFormula(unsigned int colorTheme)
{
    char *colorCode;
    switch (colorTheme) {
        case 1:  // Bubblegum
            colorCode = "21,23,3";
            break;
        case 2:  // Candy
            colorCode = "3,11,16";
            break;
        case 3:  // Cosmic
            colorCode = "30,31,32";
            break;
        case 4:  // Fire
            colorCode = "21,22,23";
            break;
        case 5:  // Floral
            colorCode = "33,13,10";
            break;
        case 6:  // Hot
            colorCode = "34,35,36";
            break;
        case 7:  // Imperial
            colorCode = "3,23,21";
            break;
        case 8:  // Ocean
            colorCode = "23,28,3";
            break;
        case 9:  // Rainbow
            colorCode = "22,13,-31";
            break;
        case 10:  // Volcano
            colorCode = "7,5,15";
            break;
        default:
            printf("mandelbrot: unknown color theme %d. Using default theme.\n", colorTheme);
            colorCode = "7,5,15";
            break;
    }

    return colorCode;
} 
