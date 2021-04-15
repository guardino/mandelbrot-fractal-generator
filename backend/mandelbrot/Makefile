CC = gcc

ifeq ($(REAL_QUAD),1)
CFLAGS = -O3 -Ofast -fomit-frame-pointer -march=native -DREAL_QUAD
LDLIBS = -lquadmath
else ifeq ($(REAL_LONG),1)
CFLAGS = -O3 -D__USE_MINGW_ANSI_STDIO -DREAL_LONG
else
CFLAGS = -O3
endif

mandelbrot: mandelbrot.o

clean:
	rm -f mandelbrot.o
	rm -f mandelbrot
