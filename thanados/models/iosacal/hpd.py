#! /usr/bin/env python
# -*- coding: utf-8 -*-
# filename: hpd.py
# Copyright 2008-2009 Stefano Costa <steko@iosa.it>
# Copyright 2008 David Laban <alsuren@gmail.com>
#
# This file is part of IOSACal, the IOSA Radiocarbon Calibration Library.

# IOSACal is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# IOSACal is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with IOSACal.  If not, see <http://www.gnu.org/licenses/>.

from collections import namedtuple
from copy import copy
from numpy import asarray

def findsorted(n, array):
    '''Return sorted array and index of n inside array.'''
    a = asarray(array)
    a.sort()
    i = a.searchsorted(n)
    return a, i

def prev(n, array):
    '''Find interval between n and its previous, inside array.'''

    a,i = findsorted(n, array)
    if i-1 < 0:
        prev = None
    else:
        prev = a[i-1]
    return prev

def next(n, array):
    '''Find interval between n and its next, inside array.'''

    a,i = findsorted(n, array)
    try:
        next = a[i+1]
    except IndexError:
        next = None
    return next

def alsuren_hpd(calibrated_age, alpha):
    '''Return year spans that have the required Highest Probability Density.'''
    hpd_curve = calibrated_age.copy()
    # sort rows by second column in inverse order
    hpd_sorted = hpd_curve[hpd_curve[:,1].argsort(),][::-1]
    hpd_cumsum = hpd_sorted[:,1].cumsum()
    # normalised values
    hpd_cumsum /= hpd_cumsum[-1]

    threshold_index = hpd_cumsum.searchsorted(1 - alpha)
    threshold_p = hpd_sorted[threshold_index][1]
    threshold_index = calibrated_age[:,1] > threshold_p
    hpd = list(hpd_curve[threshold_index,0])

    confidence_intervals = list()

    for i in hpd:
        # ^ is the XOR operator
        if (prev(i,hpd_curve[:,0]) not in hpd) ^ (next(i,hpd_curve[:,0]) not in hpd):
            confidence_intervals.append(i)
    return asarray(confidence_intervals).reshape(len(confidence_intervals)//2,2)


def confidence_percent(years, calibrated_age):
    '''Return HPD as percent value for a given span of years.'''
    percent_curve = calibrated_age.copy()
    percent_curve[:,1] /= percent_curve[:,1].sum()
    percent_sorted = percent_curve[percent_curve[:,0].argsort(),]

    year1_index = percent_sorted[:,0].searchsorted([years[0]])
    year2_index = percent_sorted[:,0].searchsorted([years[1]])
    indices = [ percent_sorted[:,0].searchsorted([year]) for year in years ]
    indices.sort()
    min_year = indices[0][0]
    max_year = indices[1][0]

    confidence_interval = percent_sorted[min_year:max_year+1,1]
    percent_result = confidence_interval.sum()
    return float(percent_result)


class ConfIntv(namedtuple('ConfIntv', ['from_year', 'to_year', 'conf_perc'])):
    __slots__ = ()

    def __format__(self, fmt='bp'):

        def ad_bc_prefix(year, prefixes='ad'):
            '''Return a string with BC/AD prefix and the given year.'''
            if prefixes == 'ad':
                neg, pos = ('BC', 'AD')
            elif prefixes == 'ce':
                neg, pos = ('BCE', 'CE')
            if year < 0:
                yearf = '{0} {1:.0f}'.format(neg, abs(year))
            else:
                yearf = '{0} {1:.0f}'.format(pos, year)
            return yearf

        fmt = fmt if len(fmt) > 0 else 'bp' # default fmt is ''
        if fmt == 'bp':
            f = '{from_year:.0f} CalBP - {to_year:.0f} CalBP ({conf_perc:2.1%})'.format(**self._asdict())
        elif fmt == 'ad' or 'ce':
            ad = {'from_year': ad_bc_prefix(1950 - self.from_year, fmt),
                  'to_year': ad_bc_prefix(1950 - self.to_year, fmt),
                  'conf_perc': self.conf_perc}
            f = '{from_year} - {to_year} ({conf_perc:2.1%})'.format(**ad)
        return f

    __str__ = __format__

class ConfIntvList(list):
    def __format__(self, fmt):
        return '\n'.join(ci.__format__(fmt) for ci in self)

    __str__ = __format__


def hpd_interval(calibrated_age, alpha):
    '''Wrapper around other functions, returns a single object.'''

    res = ConfIntvList()
    intervals = alsuren_hpd(calibrated_age, alpha)
    for interval in intervals:
        percent = confidence_percent(interval, calibrated_age)
        res.append(ConfIntv(interval[0], interval[1], percent))
    return res
