# A radiocarbon calibration software

DOI: <https://doi.org/10.5281/zenodo.630455>

IOSACal is the open source radiocarbon calibration software of the
[IOSA](http://www.iosa.it/) project. IOSACal includes:

  - a programming library
  - a [web-based application](http://iosacal.herokuapp.com/)
  - a command-line program

IOSACal is written in the Python programming language and it can run
natively on any platform where the Python interpreter is available,
including all Linux distributions, MacOS X and other UNIX operating
systems, and Microsoft Windows.

Source code is made available under the terms of the GNU General Public
License.

The documentation is online at <http://c14.iosa.it/> thanks to
[Read the Docs](https://readthedocs.org/).

![image](https://iosacal.readthedocs.io/en/latest/_images/P-769_7505_93.png)

## Why another 14C calibration software ?

Most available programs for radiocarbon calibration, like OxCal, CALIB
and others, are *freeware*. You don't have to pay for them, but on the
other side you're not free to modify them as you need, nor to access and
study the source code.

This is the main motivation behind IOSACal: creating a
free-as-in-freedom radiocarbon calibration software, with a clean
programming library, that enables experiments and integration in
existing archaeological information systems.

Furthermore, writing this software from scratch is an alternative way of
learning how 14C calibration works, not only in strict mathematical
terms, but also from a practical point of view.

## Features

IOSACal takes a radiocarbon determination and outputs a calibrated age
as a set of probability intervals. A radiocarbon date is represented by
a date in years BP (before present, that is before 1950 AD) and a
standard deviation, like 2430±170. The combination of these two values
is a numerical representation of a laboratory measure performed on the
original organic material.

The main task of the calibration process is to convert this measure into
a set of calendar dates by means of a calibration curve. Users can
choose whether they want results as a plot, a short textual summary or
both (the plot includes the summary).

IOSACal reads calibration curves in the common `.14c` format used also
by other programs. Should you have calibration data in another format,
it would be easy to either convert them to that format or modify the
source code of IOSACal to adapt it to your needs.

IOSACal is based on current calibration methods, like those described in
the 2008 paper by C. Bronk Ramsey, Radiocarbon dating: revolutions in
understanding, Archaeometry 50,2 (2008) pp. 249–275 <http://dx.doi.org/10.1111/j.1475-4754.2008.00394.x>.

## Can I use IOSACal for my research?

Yes, IOSACal has been used in research projects with large numbers of
radiocarbon dates. Using IOSACal with [Jupyter Notebooks](https://jupyter.org/)
is ideal for reproducible research that can be easily shared. Furthermore, it takes
little effort to customize and adapt the existing code to your specific
needs. IOSACal is reasonably fast, especially for batch processing.

The [web application](http://iosacal.herokuapp.com/) is ideal for
quick checks on single radiocarbon dates, and requires no
registration. Please note that the web application may not be updated
to the latest version of IOSACal.

If you make use of IOSACal in your work, please cite it with the
appropriate reference (DOI: <https://doi.org/10.5281/zenodo.630455>). This helps
us get some recognition for creating and maintaining this software free
for everyone.
