#!/usr/bin/perl

#######################################################################################
# Name:          deep_dive.pl
# Description:   Generates movie of a deep dive into the Mandelbrot set
# Author:        Cesare Guardino
# Last modified: 29 December 2023
#######################################################################################

use bignum;
use strict;
use warnings;

use Getopt::Long;
use Pod::Usage;

use constant DELTA_X      => 1.75;
use constant DELTA_Y      => 1.3;
use constant PREC_80_BIT  => 1.0e-11;  # 1.0e-13 is the limit
use constant PREC_128_BIT => 1.0e-15;  # 1.0e-16 is the limit

# POD {{{1
=head1 NAME

deep_dive.pl

=head1 SYNOPSIS

 deep_dive.pl [options] -- x_c y_c
   or
 deep_dive.pl [options] -- x_min x_max y_min y_max

 Options:
   -d,  --delay                   Delay between frames in 1/100-th of a second [DEFAULT=20].
   -e,  --extra                   Extra options to pass to mandelbrot program [DEFAULT=-c 64 -f 1 -i 2048 -s 1024 -t 3]
   -h,  --help                    Help usage message
   -n,  --num                     Number of frames in animation [DEFAULT=100]
   -z,  --zoom                    Final zoom level [DEFAULT=1.0e10]

=head1 DESCRIPTION

B<deep_dive.pl> Generates movie of a deep dive into the Mandelbrot set

=cut
# POD }}}1

my ($opt_delay, $opt_extra, $opt_help, $opt_num, $opt_verbose, $opt_zoom) = undef;
GetOptions(
            'delay|d=s'                   => \$opt_delay,
            'extra|e=s'                   => \$opt_extra,
            'help|?'                      => \$opt_help,
            "num|n=i"                     => \$opt_num,
            "verbose|v"                   => \$opt_verbose,
            'zoom|z=s'                    => \$opt_zoom,
          ) or pod2usage(2);
pod2usage(1) if $opt_help;

$opt_delay       = 20 if not defined $opt_delay;
$opt_extra       = "-c 64 -f 1 -i 2048 -s 1024 -t 3" if not defined $opt_extra;
$opt_num         = 100 if not defined $opt_num;
$opt_verbose     = 0 if not defined $opt_verbose;
$opt_zoom        = 1.0e10 if not defined $opt_zoom;

die("ERROR: Please specify (x_c y_c) or (x_min x_max y_min y_max)\n") if scalar(@ARGV) < 2;

my ($delta_x, $delta_y) = (DELTA_X, DELTA_Y);

my ($x_c, $y_c);
if (scalar(@ARGV) == 2)
{
    ($x_c, $y_c) = (1.0*$ARGV[0], 1.0*$ARGV[1]);
}
elsif (scalar(@ARGV) == 4)
{
    my ($x_min, $x_max) = (1.0*$ARGV[0], 1.0*$ARGV[1]);
    my ($y_min, $y_max) = (1.0*$ARGV[2], 1.0*$ARGV[3]);
    ($x_c, $y_c) = (0.5 * ($x_min + $x_max), 0.5 * ($y_min + $y_max));
    $opt_zoom = 2 * $delta_x / ($x_max - $x_min);
    print "INFO: Zoom = $opt_zoom\n" if $opt_verbose;
}

foreach my $file (glob('*.csv *.gif *.png'))
{
    remove_file($file);
}

my $rate = exp( log(1.0/$opt_zoom) / ($opt_num-1) );
print "INFO: Rate = $rate\n" if $opt_verbose;

for (my $i = $opt_num-1; $i >= 0; $i--)
{
    print "INFO: Iteration = $i\n" if $opt_verbose;
    my $scale = $rate ** $i;
    my $x_min = $x_c - $scale * $delta_x;
    my $x_max = $x_c + $scale * $delta_x;
    my $y_min = $y_c - $scale * $delta_y;
    my $y_max = $y_c + $scale * $delta_y;

    my $bit_accuracy = "64";
    if (abs($x_max - $x_min) < PREC_128_BIT or abs($y_max - $y_min) < PREC_128_BIT)
    {
        $bit_accuracy = "128";
    }
    elsif (abs($x_max - $x_min) < PREC_80_BIT or abs($y_max - $y_min) < PREC_80_BIT)
    {
        $bit_accuracy = "80";
    }

    $x_min = format_bignum($x_min);
    $x_max = format_bignum($x_max);
    $y_min = format_bignum($y_min);
    $y_max = format_bignum($y_max);

    if ($x_min eq $x_max or $y_min eq $y_max)
    {
        print "INFO: Reached identical ranges, exiting loop\n" if $opt_verbose;
        last;
    }

    my $mandelbrot_exe = "mandelbrot-" . $bit_accuracy;
    my $cmd = "$mandelbrot_exe $opt_extra $x_min $x_max $y_min $y_max";
    $cmd .= " 0.0 0.0";

    run_command($cmd);

    my $index = sprintf("%010d", $i);
    my $frame = "frame-" . $index . ".png";
    rename("contours.png", $frame);
}

my $gif_output = "movie.gif";
run_command("convert -delay $opt_delay frame-*.png -loop 0 $gif_output");

sub run_command
{
    my ($cmd) = @_;

    print "RUNNING: $cmd\n" if $opt_verbose;
    system($cmd);
}

sub remove_file
{
    unlink($_[0]) if -f $_[0];
}

sub format_bignum
{
    return sprintf("%.80f", $_[0]);
}
