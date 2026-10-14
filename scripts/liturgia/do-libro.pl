#!/usr/bin/env perl
# Exporta archivos "de libro" de Divinum Officium (Sancti, Tempora, Commune, Psalmorum,
# Ordo, Prayers…) ya resueltos por las funciones ORIGINALES del motor (D48):
# setupstring() evalúa los condicionales (sed rubrica …) de la versión pedida y resuelve @referencias.
# No porta lógica litúrgica: solo llama a DO y vuelca JSON.
#
# Uso:  perl do-libro.pl <DO_ROOT> "<version>" <Idioma> <horas|missa>   (lee rutas relativas por stdin, una por línea)
#   ej.  echo "Sancti/10-14.txt" | perl do-libro.pl vendor/divinum-officium "Tridentine - 1906" Espanol horas
# Salida (stdout): una línea JSON por archivo: {"archivo":"Sancti/10-14.txt","secciones":{"Officium":"…",…}}
#                  (si el archivo no existe: {"archivo":…,"secciones":null})
use strict;
use warnings;
use utf8;
use File::Spec;
use JSON::PP;

binmode(STDOUT, ':encoding(UTF-8)');
binmode(STDIN,  ':encoding(UTF-8)');

my ($root, $ARGV_VERSION, $lang, $area) = @ARGV;
die "uso: do-libro.pl <DO_ROOT> <version> <Idioma> <horas|missa>\n" unless $area;
$root = File::Spec->rel2abs($root);

our $cgi = "$root/web/cgi-bin";
our $www = "$root/web/www";
our $datafolder = "$www/$area";
our $missa = ($area eq 'missa') ? 1 : 0;
our $version;
$version = $ARGV_VERSION;
our @dayname = ('', '', '');
our ($dayofweek, $month, $day, $year, $hora, $commune, $votive, $dioecesis, $missanumber) = (0, 1, 1, 2026, '', '', '', '', 1);

chdir("$cgi/" . ($missa ? 'missa' : 'horas')) or die "no se puede entrar a cgi-bin: $!";
unshift @INC, $cgi;
require "$cgi/DivinumOfficium/SetupString.pl";

my $json = JSON::PP->new->canonical(1);
while (my $archivo = <STDIN>) {
  chomp $archivo;
  next unless length $archivo;
  my %s;
  my $res = eval { setupstring($lang, $archivo, 'resolve@' => 2) };
  my $salida = { archivo => $archivo, secciones => undef };
  if (ref $res eq 'HASH' && %$res) {
    %s = %$res;
    my %limpio;
    for my $k (keys %s) { $limpio{$k} = $s{$k} unless ref $s{$k}; }
    $salida->{secciones} = \%limpio;
  }
  print $json->encode($salida), "\n";
}
