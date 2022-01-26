#! /usr/bin/env python
# -*- coding: utf-8 -*-
# filename: core.py
# Copyright 2020 Stefano Costa <steko@iosa.it>
# Copyright 2017 Mario Gutiérrez-Roig <mariogutierrezroig@gmail.com>
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

import pkg_resources
from math import exp, pow, sqrt

import numpy as np

from thanados import app
from thanados.models.iosacal.hpd import hpd_interval


def calibrate(f_m, sigma_m, f_t, sigma_t):
    r'''Calibration formula as defined by Bronk Ramsey 2008.

    .. math::

       P(t) \propto \frac{\exp \left[-\frac{(f_m - f(t))^2}{2 (\sigma^2_{fm} + \sigma^2_{f}(t))}\right]}{\sqrt{\sigma^2_{fm} + \sigma^2_{f}(t)}}

See doi: 10.1111/j.1475-4754.2008.00394.x for a detailed account.'''

    sigma_sum = pow(sigma_m, 2) + pow(sigma_t, 2)
    P_t = ( exp( - pow(f_m - f_t, 2 ) /
                   ( 2 * ( sigma_sum ) ) ) / sqrt(sigma_sum) )
    return P_t


def confint(boot_set):
    ''' Calculates the Confidence Intervals of a Bootstrap set.

    This function returns the 68.27% C.I. (1-sigma) and 95.44% C.I. (2-sigma)
    of a set of simulated curves.

    Arguments:
        boot_set -- List with simulated curves as (x,y).

    '''

    mini = np.int(np.min([np.min(x.T[0]) for x in boot_set]))
    maxi = np.int(np.max([np.max(x.T[0]) for x in boot_set]))
    Nboot = len(boot_set)

    yrange = []
    for spd in boot_set:
        y = np.array([[val[0], val[1]] for val in spd if (val[0] >= mini) and (val[0] <= maxi)])
        yy = np.lib.pad(y.T[1], (np.int(y.T[0][0] - mini), np.int(maxi - y.T[0][-1])), 'constant', constant_values=0)
        yrange.append(yy)

    yrange = np.array(yrange).T

    CIxrange = np.arange(mini, maxi + 1)
    CI95sup = []
    CI68sup = []
    CImed = []
    CI68inf = []
    CI95inf = []
    for val in yrange:
        CI95sup.append(np.sort(val)[np.int(0.9772 * Nboot)])
        CI68sup.append(np.sort(val)[np.int(0.8413 * Nboot)])
        CImed.append(np.sort(val)[np.int(0.5 * Nboot)])
        CI68inf.append(np.sort(val)[np.int(0.1587 * Nboot)])
        CI95inf.append(np.sort(val)[np.int(0.0228 * Nboot)])

    return np.array([CIxrange, CI95inf, CI68inf, CImed, CI68sup, CI95sup])


class CalibrationCurve(np.ndarray):
    '''A radiocarbon calibration curve.

    Calibration data is loaded at runtime from source data files, and
    exposed a ``numpy.ndarray`` object.

    The curve can be loaded from:

    - a file if a path is passed as argument e.g. mycurve.14c
    - one of the standard curves such as "intcal20" or "marine20"

    Implementation from
    http://docs.scipy.org/doc/numpy/user/basics.subclassing.html

    '''

    def __new__(cls, curve, curvefile):
        print(curvefile)
        try:
            curve.shape and curve.size and curve.ndim and curve.title
        except AttributeError:
            try:
                with open (app.root_path + "/models/iosacal/data/" + curvefile, encoding='latin-1') as curve_file:
                    title = curve_file.readline().strip('#\n')
            except FileNotFoundError:
                try:
                    curve_resource_filename = pkg_resources.resource_filename("thanados.models.iosacal", f"data/{curve}.14c")
                    with open(curve_resource_filename, encoding='latin-1') as curve_file:
                        title = curve_file.readline().strip('#\n')
                except FileNotFoundError:
                    available = pkg_resources.resource_listdir('thanados.models.iosacal', 'data')
                    message = "\n".join([res[:-4] for res in available if res.endswith('.14c')])
                    message = "Available calibration curves: \n" + message
                    raise FileNotFoundError(message)
                else:
                    curve_filename = curve_resource_filename
            else:
                curve_filename = curve
            title = open(app.root_path + "/models/iosacal/data/" + curvefile, encoding='latin-1').readline().strip('#\n')
            _genfrom = np.genfromtxt(app.root_path + "/models/iosacal/data/" + curvefile, delimiter=',', encoding='latin-1')
            # linear interpolation
            ud_curve = np.flipud(_genfrom)  # the sequence must be *increasing*
            curve_arange = np.arange(ud_curve[0,0],ud_curve[-1,0],1)
            values_interp = np.interp(curve_arange, ud_curve[:,0], ud_curve[:,1])
            stderr_interp = np.interp(curve_arange, ud_curve[:,0], ud_curve[:,2])
            ud_curve_interp = np.array([curve_arange, values_interp, stderr_interp]).transpose()
            _darray = np.flipud(ud_curve_interp)  # back to *decreasing* sequence
            # We cast _darray to be our class type
            obj = np.asarray(_darray).view(cls)
            # add the new attribute to the created instance
            obj.title = title
            # Finally, we must return the newly created object:
            return obj
        else:
            return curve

    def __array_finalize__(self, obj):
        # see InfoArray.__array_finalize__ for comments
        if obj is None: return
        self.title = getattr(obj, 'title', None)

    def mixing(self, curve2_name, P, D=0, deltaR=0, err_deltaR=0):
        '''Transforms the calibration curve by mixing with another curve.

        The mathematical equation for the mixing is the same than in
        OxCal, as indicated in:

        http://c14.arch.ox.ac.uk/oxcal3/math_ca.htm#mix_curves

        Curve 1 (self): R_1 +/- E_1
        Curve 2 : R_2 +/- E_2
        Mixing : R_m +/- E_m

        where,

        R_m = (1 - P) * R_1 + P * R_2
        E_m = sqrt(((1 - P) * E_1)^2 + (P * E_2)^2 + (D * (R_1 - R_2))^2)

        The local corrections fo the reservoir effect are applicated over the
        calibration curve as:

        R_2_corrected(t) = R_2(t) + deltaR
        E_2_corrected(t) = sqrt((E_2(t))^2 + err_deltaR^2)

        Arguments:
            curve2_name -- The name of the second curve to mix
            P -- Proportion of the second curve
            D -- Error of the proportion
            deltaR -- Reservoir Effect
            err_deltaR -- Error in deltaR

        '''
        curve1 = self

        curve2 = CalibrationCurve(curve2_name)

        # Reservoir Effects
        if deltaR > 0:
            curve2.T[1] += deltaR
            curve2.T[2] = np.sqrt(np.power(curve2.T[2], 2) + np.power(err_deltaR, 2))

        self.T[0] = curve1.T[0]
        self.T[1] = (1. - P) * curve1.T[1] + P * curve2.T[1]
        self.T[2] = np.sqrt(np.power((1. - P) * curve1.T[2], 2) + np.power(P * curve2.T[2], 2) + np.power(
            D * (curve1.T[1] - curve2.T[1]), 2))

        # add the new attribute to the created instance
        self.title = "Mixed_curve"

    def __str__(self):
        return "CalibrationCurve( %s )" % self.title


class RadiocarbonDetermination(object):
    '''A radiocarbon determination as reported by the lab.'''

    def __init__(self, date, sigma, id):
        self.date  = date
        self.sigma = sigma
        self.id = id

    def calibrate(self, curve, norm=True, cutoff=5):
        '''Perform calibration, given a calibration curve.

        Arguments:
            curve -- Calibration curve as file path or short name e.g. "intcal20"
            norm -- Normalization in Calendar Scale
            cutoff -- How much of radiocarbon gaussian range are we considering (in sigmas)

        '''

        curve = CalibrationCurve(curve, curvefile='')

        _calibrated_list = []

        # We apply the cutoff for the gaussian range in 14C scale
        idx = np.where((curve.T[1] > self.date - cutoff * self.sigma) & (curve.T[1] < self.date + cutoff * self.sigma))
        idxmin = np.min(idx)
        idxmax = np.max(idx)

        for i in curve[idxmin:idxmax]:
            f_t, sigma_t = i[1:3]
            ca = calibrate(self.date, self.sigma, f_t, sigma_t)
            _calibrated_list.append((i[0],ca))

        if norm == True:
            x = np.array(_calibrated_list).T[0]
            y = np.array(_calibrated_list).T[1] / np.sum(np.array(_calibrated_list).T[1])
            calibrated_curve = np.column_stack((x, y))
        else:
            calibrated_curve = np.array(_calibrated_list)

        cal_age = CalAge(calibrated_curve, self, curve)
        return cal_age

    def __str__(self):
        return "RadiocarbonSample( {id} : {date:.0f} ± {sigma:.0f} )".format(**self.__dict__)


class R(RadiocarbonDetermination):
    '''Shorthand for RadiocarbonDetermination.'''

    pass


class CalAge(np.ndarray):
    '''A calibrated radiocarbon age.

    It is expressed as a probability distribution on the calBP
    calendar scale.

    Implementation from
    http://docs.scipy.org/doc/numpy/user/basics.subclassing.html

    '''

    def __new__(cls, input_array, radiocarbon_sample, calibration_curve):
        # Input array is an already formed ndarray instance
        # We first cast to be our class type
        obj = np.asarray(input_array).view(cls)
        # add the new attribute to the created instance
        obj.radiocarbon_sample = radiocarbon_sample
        obj.calibration_curve = calibration_curve
        obj.intervals = {
            68: hpd_interval(obj,0.318),
            95: hpd_interval(obj,0.046)
        }
        obj.median = np.mean(hpd_interval(obj, 0.5))
        # Finally, we must return the newly created object:
        return obj

    def __array_finalize__(self, obj):
        # see InfoArray.__array_finalize__ for comments
        if obj is None: return
        self.radiocarbon_sample = getattr(obj, 'radiocarbon_sample', None)
        self.calibration_curve = getattr(obj, 'calibration_curve', None)

    def calendar(self):
        '''Return the calibrated age on the calAD calendar scale.

        This method returns a copy of the calBP array, leaving the
        main object untouched.

        '''

        calendarray = self.copy()
        calendarray[:,0] *= -1
        calendarray[:,0] += 1950
        return calendarray

    def __str__(self):
        return 'CalAge( {radiocarbon_sample.id} based on "{calibration_curve.title}" )'.format(**self.__dict__)


def combine(determinations):
    '''Combine n>1 determinations related to the same event.

    ``determinations`` is an iterable of tuples (mean, error).

    This covers case 1 as described by Ward and Wilson in their
    seminal 1978 paper (DOI: 10.1111/j.1475-4754.1978.tb00208.x)

    '''

    m, s, ids = zip(*[(d.date, d.sigma, d.id) for d in determinations])

    # pooled mean
    pool_m = sum(mi / si**2 for mi, si in zip(m, s)) / \
             sum(1 / si**2 for si in s)

    # standard error on the pooled mean
    pool_s = sqrt(1/sum(1/si**2 for si in s))

    # test statistic
    test = sum((mi - pool_m)**2 / si**2 for mi, si in zip(m, s))

    desc = 'Combined from {} with test statistic {:.3f}'.format(', '.join(ids), test)

    return R(pool_m, pool_s, desc)
