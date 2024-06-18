#!/usr/bin/perl

#######################################################################################
# Name:          deep_dive.pl
# Description:   Generates movie of a deep dive into the Mandelbrot or Julia set
# Author:        Cesare Guardino
# Last modified: 18 June 2024
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

my %themes = (
  "bubblegum" =>  1,
  "candy"     =>  2,
  "cosmic"    =>  3,
  "fire"      =>  4,
  "floral"    =>  5,
  "hot"       =>  6,
  "imperial"  =>  7,
  "ocean"     =>  8,
  "rainbow"   =>  9,
  "volcano"   => 10,
);

# POD {{{1
=head1 NAME

deep_dive.pl

=head1 SYNOPSIS

 deep_dive.pl [options] -- x_c y_c [x_j y_j]
   or
 deep_dive.pl [options] -- x_min x_max y_min y_max [x_j y_j]

 Options:
   -c,  --contours                Contour levels (if omitted will be auto-calculated)
   -d,  --delay                   Delay between frames in 1/100-th of a second [DEFAULT=10]
   -f,  --fractal                 Fractal type (1=Mandelbrot, 2=Julia) [DEFAULT=1]
   -h,  --help                    Help usage message
   -i,  --iterations              Number of iterations (if omitted will be auto-calculated)
   -k,  --count                   Generate frame for specified frame only [if omitted will generate all frames]
   -m,  --movie                   Generate movie only (requires frames to exist)
   -n,  --num                     Number of frames in animation (if omitted will be auto-calculated)
   -p,  --processes               Number of parallel processes [DEFAULT=4]
   -r,  --reverse                 Reverse frame generation [DEFAULT=false]
   -s,  --size                    Frame width in pixels [DEFAULT=1024]
   -t,  --theme                   Colour theme [DEFAULT=fire]
   -v,  --verbose                 Print extra information and progress [DEFAULT=false]
   -z,  --zoom                    Final zoom level [DEFAULT=1.0e10]

=head1 DESCRIPTION

B<deep_dive.pl> Generates movie of a deep dive into the Mandelbrot set

=cut
# POD }}}1

my ($opt_contours, $opt_count, $opt_delay, $opt_fractal, $opt_help, $opt_iterations, $opt_movie, $opt_num, $opt_processes, $opt_reverse, $opt_size, $opt_theme, $opt_verbose, $opt_zoom) = undef;
GetOptions(
            'contours|c=i'                => \$opt_contours,
            'delay|d=i'                   => \$opt_delay,
            'fractal|f=i'                 => \$opt_fractal,
            'help|?'                      => \$opt_help,
            'iterations|i=i'              => \$opt_iterations,
            'count|k=i'                   => \$opt_count,
            'movie|m'                     => \$opt_movie,
            "num|n=i"                     => \$opt_num,
            "proc|p=i"                    => \$opt_processes,
            "reverse|r"                   => \$opt_reverse,
            "size|s=i"                    => \$opt_size,
            "theme|t=s"                   => \$opt_theme,
            "verbose|v"                   => \$opt_verbose,
            'zoom|z=s'                    => \$opt_zoom,
          ) or pod2usage(2);
pod2usage(1) if $opt_help;

$opt_delay       = 10 if not defined $opt_delay;
$opt_fractal     = 1 if not defined $opt_fractal;
$opt_movie       = 0 if not defined $opt_movie;
$opt_processes   = 4 if not defined $opt_processes;
$opt_reverse     = 0 if not defined $opt_reverse;
$opt_size        = 1024 if not defined $opt_size;
$opt_theme       = "fire" if not defined $opt_theme;
$opt_verbose     = 0 if not defined $opt_verbose;
$opt_zoom        = 1.0e10 if not defined $opt_zoom;

if ($opt_movie)
{
    generate_movie($opt_delay);
    exit 0;
}

die("ERROR: Please specify (x_c y_c) or (x_min x_max y_min y_max)\n") if scalar(@ARGV) < 2;
die("ERROR: Invalid fractal type (1=Mandelbrot, 2=Julia)\n") if $opt_fractal != 1 and $opt_fractal !=2;

if (not exists($themes{lc $opt_theme}))
{
    print "ERROR: Unknown theme $opt_theme selected. Available themes are:\n" ;
    foreach my $theme (sort keys(%themes))
    {
        print("    $theme\n");
    }
    exit 1;
}

my $theme_id = $themes{lc $opt_theme};

my $is_julia = $opt_fractal == 2;
my $offset = $is_julia ? 2 : 0;
my ($delta_x, $delta_y) = (DELTA_X, DELTA_Y);
my ($x_c, $y_c);
my ($x_j, $y_j);
my $expected_aspect_ratio;
if (scalar(@ARGV) == 2 + $offset)
{
    ($x_c, $y_c) = (1.0*$ARGV[0], 1.0*$ARGV[1]);
    ($x_j, $y_j) = $is_julia ? (1.0*$ARGV[2], 1.0*$ARGV[3]) : (0.0, 0.0);
    $expected_aspect_ratio = $delta_x / $delta_y;
    print "INFO: Expected aspect ratio = $expected_aspect_ratio\n" if $opt_verbose;
}
elsif (scalar(@ARGV) == 4 + $offset)
{
    my ($x_min, $x_max) = (1.0*$ARGV[0], 1.0*$ARGV[1]);
    my ($y_min, $y_max) = (1.0*$ARGV[2], 1.0*$ARGV[3]);
    ($x_j, $y_j) = $is_julia ? (1.0*$ARGV[4], 1.0*$ARGV[5]) : (0.0, 0.0);

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
    print "INFO: Zoom = $opt_zoom\n";
}
else
{
    die("ERROR: Invalid number of arguments\n");
}

$opt_num = get_num($opt_zoom) if not defined $opt_num;
$opt_iterations = get_iterations($opt_zoom) if not defined $opt_iterations;
$opt_contours = get_contours($opt_zoom) if not defined $opt_contours;

my $rate = exp( log(1.0/$opt_zoom) / ($opt_num-1) );
print "INFO: Number of frames = $opt_num\n";
print "INFO: Iterations = $opt_iterations\n";
print "INFO: Contours = $opt_contours\n";
print "INFO: Rate = $rate\n" if $opt_verbose;

if (defined $opt_count)
{
    $opt_count = $opt_num-1 if $opt_count == -1;
    die("ERROR: Iteration must be between 0 and " . ($opt_num-1) . "\n") if $opt_count < -1 or $opt_count > $opt_num-1;
    
    if ($opt_count >= 0)
    {
        print "INFO: Generating frame $opt_count only ...\n";
        generate_frame($opt_count) if not frame_exists($opt_count);
        exit 0;
    }
}

print "INFO: Beginning iterations ...\n" if $opt_verbose;
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

sub get_iterations
{
    my ($zoom) = @_;

    if ($zoom < 1.0e2)
    {
        return 1024;
    }
    elsif ($zoom < 1.0e5)
    {
        return 2048;
    }
    elsif ($zoom < 1.0e13)
    {
        return 4096;
    }
    elsif ($zoom < 1.0e20)
    {
        return 8192;
    }
    elsif ($zoom < 1.0e32)
    {
        return 16384;
    }
    else
    {
        return 32768;
    }
}

sub get_contours
{
    my ($zoom) = @_;

    if ($zoom < 1.0e2)
    {
        return 32;
    }
    elsif ($zoom < 1.0e5)
    {
        return 64;
    }
    elsif ($zoom < 1.0e13)
    {
        return 128;
    }
    elsif ($zoom < 1.0e20)
    {
        return 256;
    }
    elsif ($zoom < 1.0e32)
    {
        return 512;
    }
    else
    {
        return 512;
    }
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
    my $extra_flags = "-c $opt_contours -f $opt_fractal -i $opt_iterations -s $opt_size -t $theme_id";
    my $flags = "-i $i $verbose_str -e \"$extra_flags\" -- $x_min $x_max $y_min $y_max $x_j $y_j";
    run_command("start /b perl $FindBin::Bin/fractal.pl $flags");

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
