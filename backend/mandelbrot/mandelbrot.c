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

#define NUM_X_PIXELS 1024
#define NUM_Y_PIXELS 768
#define NUM_CONTOUR_LEVELS 40
#define MAX_ITERATIONS 1000

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
FILE *outputPoints(char *fileName, const struct cpoint *cpoints, const struct sregion screen);
FILE *printPointsInSet(char *fileName, const struct cpoint *cpoints, const struct sregion screen, char symbol);
FILE *createGnuplotScipt(char *fileName, unsigned int numContourLevels);

int main(int argc, char *argv[])
{
    unsigned int nPx = NUM_X_PIXELS;
    unsigned int nPy = NUM_Y_PIXELS;
    double xMin = -2.5, xMax = 1.0, yMin = -1.3, yMax = 1.3;

    int c;
    char **size;
    while (--argc > 0 && (*++argv)[0] == '-')
        while (c = *++argv[0])
            switch (c) {
            case 's':
                size = argv;
                nPx = atoi(*++size);
                --argc;
                break;
            default:
                printf("mandelbrot: illegal option %c\n", c);
                argc = -1;
                break;
            }
    if (argc !=0 && argc != 4) {
        printf("Usage: mandelbrot [-s size] [x_min x_max y_min y_max]\n");
        printf("Example: mandelbrot -s 1024 -2.5 1.0 -1.3 1.3\n");
        return 1;
    }

    if (argc == 4)
    {
        xMin = atof(*++argv);
        xMax = atof(*++argv);
        yMin = atof(*++argv);
        yMax = atof(*++argv);
    }

    nPy = (yMax - yMin) * nPx / (xMax - xMin);
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

    outputPoints("contours.csv", cpoints, screen);
    printPointsInSet("mandelbrot.txt", cpoints, screen, '*');
    free(cpoints);

    if (createGnuplotScipt("contours.plt", NUM_CONTOUR_LEVELS) != NULL)
    {
        system("gnuplot < contours.plt");
        system("ps2pdf contours.ps");
        system("contours.pdf");
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

FILE *outputPoints(char *fileName, const struct cpoint *cpoints, const struct sregion screen)
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
            fprintf(fp, "%f, %f, %d\n", cpoints->x0, cpoints->y0, (cpoints->iter)%NUM_CONTOUR_LEVELS);
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

FILE *createGnuplotScipt(char *fileName, unsigned int numContourLevels)
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
    fprintf(fp, "set cntrparam levels %d\n", numContourLevels);
    fprintf(fp, "set isosample 250, 250\n");
    fprintf(fp, "set palette rgbformulae 7,5,15\n");
    //fprintf(fp, "set palette rgbformulae 33,13,10\n");
    fprintf(fp, "\n");
    fprintf(fp, "set size ratio -1\n");
    fprintf(fp, "set term post color\n");
    fprintf(fp, "set output 'contours.ps'\n");
    fprintf(fp, "#set terminal post size 1024,768\n");
    fprintf(fp, "splot 'contours.csv' u 1:2:3 w image\n");
    fclose(fp);

    return fp;
}
