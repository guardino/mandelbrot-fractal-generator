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

#define CONTOUR_LEVELS 64
#define COLOR_THEME 2
#define MAX_ITERATIONS 1024
#define MAX_PIXELS 2048

struct cpoint {
    double x0, y0;
    unsigned int iter;
};

struct cregion {
    struct cpoint A, B;
};

struct sregion {
    unsigned int nPx, nPy;
};

struct cpoint *scanPoints(const struct cregion domain, const struct sregion screen);
FILE *outputPoints(char *fileName, const struct cpoint *cpoints, const struct sregion screen, unsigned int contourLevels);
FILE *printPointsInSet(char *fileName, const struct cpoint *cpoints, const struct sregion screen, char symbol);
FILE *createGnuplotScipt(char *fileName, unsigned int contourLevels, unsigned int width, unsigned int height, unsigned int colorTheme);
char *getRGBFormula(unsigned int colorTheme);

int main(int argc, char *argv[])
{
    unsigned int maxPixels = MAX_PIXELS;
    unsigned int contourLevels = CONTOUR_LEVELS;
    unsigned int colorTheme = COLOR_THEME;
    unsigned int nPx;
    unsigned int nPy;
    double xMin = -2.5, xMax = 1.0, yMin = -1.3, yMax = 1.3;

    int c;
    while (--argc > 4 && (*++argv)[0] == '-')
        while ((c = *++argv[0]) && !isdigit(c))
            switch (c) {
            case 'c':
                contourLevels = atoi(*++argv);
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

    if (argc !=0 && argc != 4) {
        printf("Usage: mandelbrot [-c contours] [-s size] [-t theme] [x_min x_max y_min y_max]\n");
        printf("Example: mandelbrot -c 64 -s 2048 -t 2 -2.5 1.0 -1.3 1.3\n");
        return 1;
    }

    if (argc == 4)
    {
        xMin = atof(*++argv);
        xMax = atof(*++argv);
        yMin = atof(*++argv);
        yMax = atof(*++argv);
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
    struct cregion domain = { A, B };
    struct sregion screen = { nPx, nPy };

    struct cpoint *cpoints = scanPoints(domain, screen);
    system("cmd.exe /c del /F/Q contours.* mandelbrot.txt");
    if (cpoints == NULL) {
        printf("mandelbrot: error in calculating points");
        return 2;
    }

    outputPoints("contours.csv", cpoints, screen, contourLevels);
    printPointsInSet("mandelbrot.txt", cpoints, screen, '*');
    free(cpoints);

    if (createGnuplotScipt("contours.plt", contourLevels, nPx, nPy, colorTheme) != NULL)
    {
        system("gnuplot < contours.plt");
        //system("ps2pdf contours.ps");
        //system("contours.pdf");
    }
}

struct cpoint *scanPoints(const struct cregion domain, const struct sregion screen)
{
    struct cpoint *cpoints = malloc(screen.nPx * screen.nPy * sizeof(struct cpoint));

    double deltaX = (domain.B.x0 - domain.A.x0) / screen.nPx;
    double deltaY = (domain.B.y0 - domain.A.y0) / screen.nPy;

    //For each pixel (Px, Py) on the screen, do:
    struct cpoint *ptr = cpoints;
    for (int j = 0; j < screen.nPy; j++)
    {
        for (int i = 0; i < screen.nPx; i++)
        {
            //x0 = scaled x coordinate of pixel (scaled to lie in the Mandelbrot X scale (-2.5, 1))
            //y0 = scaled y coordinate of pixel (scaled to lie in the Mandelbrot Y scale (-1, 1))
            double x0 = domain.A.x0 + deltaX*i;
            double y0 = domain.A.y0 + deltaY*j;

            double x = 0.0;
            double y = 0.0;
            unsigned int iteration = 0;
            while (x*x + y*y < 4 && iteration < MAX_ITERATIONS)
            {
                double xTemp = x*x - y*y + x0;
                y = 2*x*y + y0;
                x = xTemp;
                iteration += 1;
            }

            struct cpoint p = { x0, y0, iteration };
            *ptr++ = p;
        }
    }

    return cpoints;
}

FILE *outputPoints(char *fileName, const struct cpoint *cpoints, const struct sregion screen, unsigned int contourLevels)
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
            fprintf(fp, "%.17g, %.17g, %d\n", cpoints->x0, cpoints->y0, (cpoints->iter)%contourLevels);
            cpoints++;
        }

        fprintf(fp, "\n");
    }

    fclose(fp);
}

FILE *printPointsInSet(char *fileName, const struct cpoint *cpoints, const struct sregion screen, char symbol)
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
            fprintf(fp, "%c", (cpoints->iter)== MAX_ITERATIONS ? symbol : ' ');
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
    fprintf(fp, "set isosample 250, 250\n");
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
        case 1:  // Candy
            colorCode = "3,11,16";
            break;
        case 2:  // Cosmic
            colorCode = "30,31,32";
            break;
        case 3:  // Fire
            colorCode = "21,22,23";
            break;
        case 4:  // Ocean
            colorCode = "23,28,3";
            break;
        case 5:  // Rainbow
            colorCode = "22,13,-31";
            break;
        case 6:  // Violet
            colorCode = "33,13,10";
            break;
        case 7:  // Volcano
            colorCode = "7,5,15";
            break;
        default:
            printf("mandelbrot: unknown color theme %d. Using default theme.\n", colorTheme);
            colorCode = "7,5,15";
            break;
    }

    return colorCode;
} 
