#!/usr/bin/perl

#######################################################################################
# Name:          deep_dive.pl
# Description:   Generates movie of a deep dive into the Mandelbrot set
# Author:        Cesare Guardino
# Last modified: 3 January 2024
#######################################################################################

use bignum ( p => -80 );
use strict;
use warnings;

use File::Path;
use Getopt::Long;
use Pod::Usage;

use constant DELTA_X      => 1.75;
use constant DELTA_Y      => 1.3;
use constant PREC_80_BIT  => 1.0e-11;  # 1.0e-13 is the limit
use constant PREC_128_BIT => 1.0e-15;  # 1.0e-16 is the limit
use constant TOLERANCE    => 1.0e-6;

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
   -r,  --reverse                 Reverse frame generation [DEFAULT=false]
   -z,  --zoom                    Final zoom level [DEFAULT=1.0e10]

=head1 DESCRIPTION

B<deep_dive.pl> Generates movie of a deep dive into the Mandelbrot set

=cut
# POD }}}1

my ($opt_delay, $opt_extra, $opt_help, $opt_num, $opt_reverse, $opt_verbose, $opt_zoom) = undef;
GetOptions(
            'delay|d=s'                   => \$opt_delay,
            'extra|e=s'                   => \$opt_extra,
            'help|?'                      => \$opt_help,
            "num|n=i"                     => \$opt_num,
            "reverse|r"                   => \$opt_reverse,
            "verbose|v"                   => \$opt_verbose,
            'zoom|z=s'                    => \$opt_zoom,
          ) or pod2usage(2);
pod2usage(1) if $opt_help;

$opt_delay       = 20 if not defined $opt_delay;
$opt_extra       = "-c 64 -f 1 -i 2048 -s 1024 -t 3" if not defined $opt_extra;
$opt_num         = 100 if not defined $opt_num;
$opt_reverse     = 0 if not defined $opt_reverse;
$opt_verbose     = 0 if not defined $opt_verbose;
$opt_zoom        = 1.0e10 if not defined $opt_zoom;

die("ERROR: Please specify (x_c y_c) or (x_min x_max y_min y_max)\n") if scalar(@ARGV) < 2;

my ($delta_x, $delta_y) = (DELTA_X, DELTA_Y);

my ($x_c, $y_c);
my $expected_aspect_ratio;
if (scalar(@ARGV) == 2)
{
    ($x_c, $y_c) = (1.0*$ARGV[0], 1.0*$ARGV[1]);
    $expected_aspect_ratio = $delta_x / $delta_y;
    print "INFO: Expected aspect ratio = $expected_aspect_ratio\n" if $opt_verbose;
}
elsif (scalar(@ARGV) == 4)
{
    my ($x_min, $x_max) = (1.0*$ARGV[0], 1.0*$ARGV[1]);
    my ($y_min, $y_max) = (1.0*$ARGV[2], 1.0*$ARGV[3]);

    die("ERROR: x_min should be less than x_max\n") if $x_min >= $x_max;
    die("ERROR: y_min should be less than y_max\n") if $y_min >= $y_max;

    my $dx = ($x_max - $x_min);
    my $dy = ($y_max - $y_min);
    $expected_aspect_ratio = $dx / $dy;
    print "INFO: Expected aspect ratio = $expected_aspect_ratio\n" if $opt_verbose;
    if ($expected_aspect_ratio < 1)
    {
        $delta_x = $expected_aspect_ratio * $delta_y;
    }
    else
    {
        $delta_y = $delta_x / $expected_aspect_ratio;
    }

    ($x_c, $y_c) = (0.5 * ($x_min + $x_max), 0.5 * ($y_min + $y_max));
    print "INFO: x_c = $x_c\n" if $opt_verbose;
    print "INFO: y_c = $y_c\n" if $opt_verbose;
    $opt_zoom = 2 * $delta_x / $dx;
    print "INFO: Zoom = $opt_zoom\n" if $opt_verbose;
}

foreach my $file (glob('*.csv *.gif *.png'))
{
    remove_file($file);
}

my $rate = exp( log(1.0/$opt_zoom) / ($opt_num-1) );
print "INFO: Rate = $rate\n" if $opt_verbose;
print "INFO: Beginning iterations ...\n" if $opt_verbose;

if ($opt_reverse)
{
    for (my $i = $opt_num-1; $i >= 0; $i--)
    {
        generate_frame($i);
    }
}
else
{
    for (my $i = 0; $i < $opt_num; $i++)
    {
        generate_frame($i);
    }
}

print "\n" if $opt_verbose;

my $gif_output = "movie.gif";
run_command("convert -delay $opt_delay frame-*.png -loop 0 $gif_output");

if (-e $gif_output)
{
    my $mp4_output = "movie.mp4";
    # See https://unix.stackexchange.com/questions/40638/how-to-do-i-convert-an-animated-gif-to-an-mp4-or-mv4-on-the-command-line
    run_command("ffmpeg -i $gif_output -movflags faststart -pix_fmt yuv420p -vf \"scale=trunc(iw/2)*2:trunc(ih/2)*2\" $mp4_output");
}

sub generate_frame
{
    my ($i) = @_;

    print "\n" if $opt_verbose;
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

    # Check aspect ratio - included here as sometimes this comes out slightly wrong:
    my $dx = ($x_max - $x_min);
    my $dy = ($y_max - $y_min);
    my $aspect_ratio = $dx / $dy;
    print "INFO: Aspect ratio = $aspect_ratio\n" if $opt_verbose;
    if ( abs($aspect_ratio-$expected_aspect_ratio) > TOLERANCE )
    {
        print "WARNING: Aspect ratio for iteration $i does not match expected $expected_aspect_ratio\n";
    }

    if ($x_min eq $x_max or $y_min eq $y_max)
    {
        print "INFO: Identical ranges detected for iteration $i, skipping iteration\n";
        next;
    }

    my $mandelbrot_exe = "mandelbrot-" . $bit_accuracy;
    my $cmd = "$mandelbrot_exe $opt_extra $x_min $x_max $y_min $y_max";
    $cmd .= " 0.0 0.0";

    my $index = sprintf("%010d", $i);
    my $name = "frame-$index";
    rmtree($name) if -d $name;
    mkdir($name);
    die("ERROR: Temporary directory $name does not exist\n") if not -d $name;
    chdir($name);
    run_command($cmd);
    rename("contours.png", "../$name.png");
    chdir("..");
    rmtree($name);
}

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
