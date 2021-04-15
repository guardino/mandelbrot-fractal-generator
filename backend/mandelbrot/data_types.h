/*
    Name:            data_types.h
    Description:     Data types for Mandelbrot set generation code
    Author:          Cesare Guardino
    First version:   April 11 2021
*/

#ifndef DATATYPES_H
#define DATATYPES_H

#ifdef REAL_QUAD
    typedef __float128 REAL;
#else
    #ifdef REAL_LONG
        typedef long double REAL;
    #else
        typedef double REAL;
    #endif  // REAL_LONG
#endif  // REAL_QUAD

#endif  // DATATYPES_H


