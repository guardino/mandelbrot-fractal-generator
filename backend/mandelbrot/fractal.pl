#!/usr/bin/perl

#######################################################################################
# Name:          fractal.pl
# Description:   Wrapper for Mandelbrot/Julia set fractal creation program 
# Author:        Cesare Guardino
# Last modified: 18 June 2024
#######################################################################################

use bignum ( p => -80 );
use strict;
use warnings;

use File::Path;
use Getopt::Long;
use Pod::Usage;

use constant PREC_80_BIT  => 1.0e-11;  # 1.0e-13 is the limit
use constant PREC_128_BIT => 1.0e-15;  # 1.0e-16 is the limit

# POD {{{1
=head1 NAME

fractal

=head1 SYNOPSIS

 fractal [options] -- x_min x_max y_min y_max [x_j y_j]

 Options:
   -e,  --extra                   Extra options to pass to mandelbrot program [DEFAULT=-c 64 -f 1 -i 2048 -s 1024 -t 3]
   -i,  --index                   Index
   -h,  --help                    Help usage message
   -v,  --verbose                 Print extra information and progress [DEFAULT=false]

=head1 DESCRIPTION

B<fractal> Wrapper for Mandelbrot/Julia set fractal creation program 

=cut
# POD }}}1

my ($opt_extra, $opt_help, $opt_index, $opt_verbose) = undef;
GetOptions(
            'extra|e=s'                   => \$opt_extra,
            'help|?'                      => \$opt_help,
            'index|i=i'                   => \$opt_index,
            "verbose|v"                   => \$opt_verbose,
          ) or pod2usage(2);
pod2usage(1) if $opt_help;

$opt_extra       = "-c 64 -f 1 -i 2048 -s 1024 -t 3" if not defined $opt_extra;
$opt_index       = 0 if not defined $opt_index;
$opt_verbose     = 0 if not defined $opt_verbose;

my $is_julia = $opt_extra =~ / -f 2 /;

die("ERROR: Please specify (x_min x_max y_min y_max)\n") if scalar(@ARGV) != 4 and not $is_julia;
die("ERROR: Please specify (x_min x_max y_min y_max x_j y_j)\n") if scalar(@ARGV) != 6 and $is_julia;

my ($x_min, $x_max) = (1.0*$ARGV[0], 1.0*$ARGV[1]);
my ($y_min, $y_max) = (1.0*$ARGV[2], 1.0*$ARGV[3]);
my ($x_j, $y_j)     = (1.0*$ARGV[4], 1.0*$ARGV[5]) if $is_julia;

die("ERROR: x_min should be less than x_max\n") if $x_min >= $x_max;
die("ERROR: y_min should be less than y_max\n") if $y_min >= $y_max;

my $bit_accuracy = "64";
if (abs($x_max - $x_min) < PREC_128_BIT or abs($y_max - $y_min) < PREC_128_BIT)
{
    $bit_accuracy = "128";
}
elsif (abs($x_max - $x_min) < PREC_80_BIT or abs($y_max - $y_min) < PREC_80_BIT)
{
    $bit_accuracy = "80";
}

my $mandelbrot_exe = "mandelbrot-" . $bit_accuracy;
my $cmd = "$mandelbrot_exe $opt_extra $x_min $x_max $y_min $y_max";
$cmd .= " $x_j $y_j" if $is_julia;

my $index = sprintf("%010d", $opt_index);
my $name = "frame-$index";
rmtree($name) if -d $name;
mkdir($name);
die("ERROR: Temporary directory $name does not exist\n") if not -d $name;
chdir($name);
mkdir("$name.lok");
run_command($cmd);
rename("contours.png", "../$name.png");
rmdir("$name.lok");
chdir("..");
rmtree($name);

sub run_command
{
    my ($cmd) = @_;

    print "RUNNING: $cmd\n" if $opt_verbose;
    system($cmd);
}
