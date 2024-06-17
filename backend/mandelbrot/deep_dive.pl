#!/usr/bin/perl

#######################################################################################
# Name:          deep_dive.pl
# Description:   Generates movie of a deep dive into the Mandelbrot set
# Author:        Cesare Guardino
# Last modified: 17 June 2024
#######################################################################################

use bignum ( p => -80 );
use strict;
use warnings;

use File::Path;
use FindBin;
use Getopt::Long;
use Pod::Usage;

use constant DELTA_X      => 1.75;
use constant DELTA_Y      => 1.3;
use constant TOLERANCE    => 1.0e-6;

# POD {{{1
=head1 NAME

deep_dive.pl

=head1 SYNOPSIS

 deep_dive.pl [options] -- x_c y_c
   or
 deep_dive.pl [options] -- x_min x_max y_min y_max

 Options:
   -d,  --delay                   Delay between frames in 1/100-th of a second [DEFAULT=10].
   -e,  --extra                   Extra options to pass to mandelbrot program [DEFAULT=-c 64 -f 1 -i 4096 -s 1024 -t 3]
   -h,  --help                    Help usage message
   -i,  --iteration               Generate frame for specified iteration only [if omitted will generate all frames]
   -m,  --movie                   Generate movie only (requires frames to exist)
   -n,  --num                     Number of frames in animation [if omitted will be auto-calculated]
   -p,  --processes               Number of parallel processes [DEFAULT=4]
   -r,  --reverse                 Reverse frame generation [DEFAULT=false]
   -v,  --verbose                 Print extra information and progress [DEFAULT=false]
   -z,  --zoom                    Final zoom level [DEFAULT=1.0e10]

=head1 DESCRIPTION

B<deep_dive.pl> Generates movie of a deep dive into the Mandelbrot set

=cut
# POD }}}1

my ($opt_delay, $opt_extra, $opt_help, $opt_iteration, $opt_movie, $opt_num, $opt_processes, $opt_reverse, $opt_verbose, $opt_zoom) = undef;
GetOptions(
            'delay|d=i'                   => \$opt_delay,
            'extra|e=s'                   => \$opt_extra,
            'help|?'                      => \$opt_help,
            'iteration|i=i'               => \$opt_iteration,
            'movie|m'                     => \$opt_movie,
            "num|n=i"                     => \$opt_num,
            "proc|p=i"                    => \$opt_processes,
            "reverse|r"                   => \$opt_reverse,
            "verbose|v"                   => \$opt_verbose,
            'zoom|z=s'                    => \$opt_zoom,
          ) or pod2usage(2);
pod2usage(1) if $opt_help;

$opt_delay       = 10 if not defined $opt_delay;
$opt_extra       = "-c 64 -f 1 -i 4096 -s 1024 -t 3" if not defined $opt_extra;
$opt_movie       = 0 if not defined $opt_movie;
$opt_processes   = 4 if not defined $opt_processes;
$opt_reverse     = 0 if not defined $opt_reverse;
$opt_verbose     = 0 if not defined $opt_verbose;
$opt_zoom        = 1.0e10 if not defined $opt_zoom;

if ($opt_movie)
{
    generate_movie($opt_delay);
    exit 0;
}

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

$opt_num = get_num($opt_zoom) if not defined $opt_num;

if (defined $opt_iteration)
{
    $opt_iteration = $opt_num-1 if $opt_iteration == -1;
    die("ERROR: Iteration must be between 0 and " . ($opt_num-1) . "\n") if $opt_iteration < -1 or $opt_iteration > $opt_num-1;
    
    if ($opt_iteration >= 0)
    {
        print "INFO: Generating frame $opt_iteration only ...\n";
        generate_frame($opt_iteration) if not frame_exists($opt_iteration);
        exit 0;
    }
}

my $rate = exp( log(1.0/$opt_zoom) / ($opt_num-1) );
print "INFO: Beginning iterations ...\n" if $opt_verbose;
print "INFO: Number of frames = $opt_num\n";
print "INFO: Rate = $rate\n" if $opt_verbose;

my @jobs = ();
my @skipped = ();

if ($opt_reverse)
{
    for (my $i = $opt_num-1; $i >= 0; $i--)
    {
        next if frame_exists($i);
        next if not generate_frame($i);
    }
}
else
{
    for (my $i = 0; $i < $opt_num; $i++)
    {
        next if frame_exists($i);
        next if not generate_frame($i);
    }
}

check_jobs(1);
check_frames();

generate_movie($opt_delay);

sub generate_movie
{
    my ($delay) = @_;

    my $gif_output = "movie-$delay.gif";
    remove_file($gif_output);

    print "INFO: Generating $gif_output ...\n";

    my $fps = sprintf("%.1f", 100 / $opt_delay);
    #my $movie_length = sprintf("%.1f", $opt_num / $fps);
    print "INFO: Frames per second equivalent is $fps\n";
    #print "INFO: Expected length of movie is $movie_length seconds\n";

    run_command("convert -delay $delay frame-*.png -loop 0 $gif_output");
    
    if (-e $gif_output)
    {
        my $mp4_output = "movie-$delay.mp4";
        print "INFO: Generating $mp4_output ...\n";
        remove_file($mp4_output);
        # See https://unix.stackexchange.com/questions/40638/how-to-do-i-convert-an-animated-gif-to-an-mp4-or-mv4-on-the-command-line
        run_command("ffmpeg -i $gif_output -movflags faststart -pix_fmt yuv420p -vf \"scale=trunc(iw/2)*2:trunc(ih/2)*2\" $mp4_output");
    }
}

sub get_num
{
    my ($zoom) = @_;

    # Scale point: zoom of 1e15 requires 500 frames
    my $N = log10($zoom) * 500 / 15.0;

    # Round to int and return
    return sprintf("%.0f", int($N));
}

sub log10
{
    my $n = shift;

    return log($n) / log(10);
}

sub frame_exists
{
    my ($i) = @_;

    my $index = sprintf("%010d", $i);
    my $name = "frame-$index";
    my $image = "$name.png";

    return -e $image ? 1 : 0;
}

sub generate_frame
{
    my ($i) = @_;

    print "\n" if $opt_verbose;
    print "INFO: Iteration = $i\n";
    my $scale = $rate ** $i;
    my $x_min = $x_c - $scale * $delta_x;
    my $x_max = $x_c + $scale * $delta_x;
    my $y_min = $y_c - $scale * $delta_y;
    my $y_max = $y_c + $scale * $delta_y;

    # Check aspect ratio - included here as sometimes this comes out slightly wrong:
    my $dx = ($x_max - $x_min);
    my $dy = ($y_max - $y_min);

    my $zoom = 2 * $delta_x / $dx;
    print "INFO: Current zoom = $zoom\n" if $opt_verbose;
    my $aspect_ratio = $dx / $dy;
    print "INFO: Current aspect ratio = $aspect_ratio\n" if $opt_verbose;

    if ( abs($aspect_ratio-$expected_aspect_ratio) > TOLERANCE )
    {
        print "WARNING: Aspect ratio for iteration $i does not match expected $expected_aspect_ratio\n";
    }

    if ($x_min eq $x_max or $y_min eq $y_max)
    {
        print "INFO: Identical ranges detected for iteration $i, skipping iteration\n";
        push(@skipped, $i);
        return 0;
    }

    check_jobs(0);
    push(@jobs, $i);
    my $verbose_str = $opt_verbose ? '-v' : '';
    run_command("start /b perl $FindBin::Bin/fractal.pl -i $i $verbose_str -e \"$opt_extra\" -- $x_min $x_max $y_min $y_max");

    return 1;
}

sub check_jobs
{
    my ($end) = @_;

    print "INFO: Current frame job indices: @jobs\n" if $opt_verbose;

    while (1)
    {
        if ($end)
        {
            last if (scalar(@jobs) == 0);
        }
        else
        {
            last if (scalar(@jobs) < $opt_processes);
        }

        foreach my $j (@jobs)
        {
            my $index = sprintf("%010d", $j);
            my $name = "frame-$index";
            if (-e "$name.png" and not -d "$name" and not -d "$name/$name.lok")
            {
                my $k = 0;
                $k++ until ($k == scalar(@jobs) or $jobs[$k] eq $j);
                die("ERROR: Error in search for completed job with index $k\n") if $k == $opt_num;
                splice(@jobs, $k, 1);
            }
        }

        sleep(2);
    }
}

sub check_frames
{
    print "\n" if $opt_verbose;

    @skipped = sort(@skipped);

    my @missing = ();
    for (my $i = 0; $i < $opt_num; $i++)
    {
        my $index = sprintf("%010d", $i);
        my $name = "frame-$index";
        my $image = "$name.png";

        next if is_skipped($i);
        push(@missing, $i) if not -e $image;
        print "INFO: $image does not exist\n" if not -e $image;
    }

    die("ERROR: Some frames are missing, no movie will be generated. Exiting.\n") if scalar(@missing) > 0;

    print "\n" if $opt_verbose;
}

sub is_skipped
{
    my ($i) = @_;

    my $k = 0;
    $k++ until ($k == scalar(@skipped) or $skipped[$k] eq $i);

    return $k < scalar(@skipped);
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
