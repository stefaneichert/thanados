#! /usr/bin/env python
# -*- coding: utf-8 -*-
# filename: plot.py
# Copyright 2018 Stefano Costa <steko@iosa.it>
# Copyright 2020 Karl Håkansson <kalle@jomenvisst.de>
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

import matplotlib.pyplot as plt
import thanados.models.iosacal

from scipy.stats import norm

COLORS = {
    'bgcolor': '#e5e4e5',
}

def single_plot(calibrated_age, oxcal=False, output=None, BP='bp'):

    calibrated_age = calibrated_age
    f_m = calibrated_age.radiocarbon_sample.date
    sigma_m = calibrated_age.radiocarbon_sample.sigma
    radiocarbon_sample_id = calibrated_age.radiocarbon_sample.id
    calibration_curve = calibrated_age.calibration_curve
    intervals = calibrated_age.intervals
    sample_interval = calibration_curve[:,0].copy() # for determination plot

    # adjust plot bounds
    min_year, max_year = (50000, -50000)
    min_x = min(calibrated_age[:,0])
    max_x = max(calibrated_age[:,0])
    if min_year > min_x:
        min_year = min_x
    if max_year < max_x:
        max_year = max_x

    # do not plot the part of calibration curve that is not visible
    # greatly reduces execution time \o/
    cutmin = calibration_curve[calibration_curve[:,0]>min_x]
    cutmax = cutmin[cutmin[:,0]<max_x]
    calibration_curve = cutmax

    if BP != 'bp':
        if min_year < 0 and max_year > 0:
            ad_bp_label = "BC/AD"
        elif min_year < 0 and max_year < 0:
            ad_bp_label = "BC"
        elif min_year > 0 and max_year > 0:
            ad_bp_label = "AD"
    else:
        ad_bp_label = "BP"

    string68 = '{:{fmt}}'.format(calibrated_age.intervals[68], fmt=BP)
    string95 = '{:{fmt}}'.format(calibrated_age.intervals[95], fmt=BP)

    fig = plt.figure(figsize=(12,8))
    fig.clear()
    ax1 = plt.subplot(111)
    ax1.set_facecolor(COLORS['bgcolor'])
    plt.xlabel("Calibrated age ({})".format(ad_bp_label))
    plt.ylabel("Radiocarbon determination (BP)")
    plt.text(0.5, 0.95,
         r'{}: {:.0f} ± {:.0f} BP'.format(radiocarbon_sample_id, f_m, sigma_m),
         horizontalalignment='center',
         verticalalignment='center',
         transform = ax1.transAxes,
         bbox=dict(facecolor='white', alpha=0.5, lw=0))
    plt.text(0.75, 0.80,
         '68.2% probability\n{}\n\n95.4% probability\n{}'.format(string68, string95),
         horizontalalignment='left',
         verticalalignment='center',
         transform = ax1.transAxes,
         bbox=dict(facecolor='white', alpha=0.5, lw=0))
    plt.text(0.0, 1.0,'IOSACal v{}; {}'.format(thanados.models.iosacal.__VERSION__, calibration_curve.title),
         horizontalalignment='left',
         verticalalignment='bottom',
         transform = ax1.transAxes,
         size=10,
         bbox=dict(facecolor='none', alpha=0.9, lw=0))

    # Calendar Age

    ax2 = plt.twinx()

    if oxcal is True:
        # imitate OxCal
        ax1.set_facecolor('white')
        ax2.fill_between(
            calibrated_age[:,0],
            calibrated_age[:,1]*0,
            calibrated_age[:,1],
            facecolor='k',
            alpha=0.3,
            label='Calendar Age'
            )
        ax2.plot(
            calibrated_age[:,0],
            calibrated_age[:,1],
            'k',
            alpha=0
            )
    else:
        ax2.fill_between(
            calibrated_age[:,0],
            calibrated_age[:,1]*0,
            calibrated_age[:,1],
            facecolor='k',
            alpha=0.3,
            label='Calendar Age'
            )
        ax2.plot(
            calibrated_age[:,0],
            calibrated_age[:,1],
            'k',
            alpha=0
            )

    ax2.set_ybound(min(calibrated_age[:,1]),max(calibrated_age[:,1])*3)
    ax2.set_xbound(min(calibrated_age[:,0]),max(calibrated_age[:,0]))
    ax2.set_axis_off()

    # Radiocarbon Age
    sample_curve = norm.pdf(sample_interval, f_m, sigma_m)

    if oxcal is True:
        sample_fill_color = '#fac5cd'
    else:
        sample_fill_color = 'w'
    ax3 = plt.twiny(ax1)
    ax3.fill(
        sample_curve,
        sample_interval,
        '1.0',
        facecolor=sample_fill_color,
        alpha=0.6
        )
    ax3.set_xbound(0,max(sample_curve)*4)
    ax3.set_axis_off()

    # Calibration Curve

    curve_low = calibration_curve[:,1] - calibration_curve[:,2]
    curve_high = calibration_curve[:,1] + calibration_curve[:,2]

    ax1.fill_between(calibration_curve[:,0],
                     curve_low,
                     curve_high,
                     facecolor='blue',
                     edgecolor='none',
                     alpha=0.15)
    ax1.plot(calibration_curve[:,0], calibration_curve[:,1], 'k', lw=0.5, alpha=0.7)

    # Confidence intervals
    if oxcal is True:
        for i in intervals[68]:
            ax1.axvspan(
                i.from_year +1,
                i.to_year -1,
                ymin=0.0206,
                ymax=0.041,
                facecolor='k',
                alpha=1)
            ax1.axvspan(
                i.from_year,
                i.to_year,
                ymin=0.0256,
                ymax=0.041,
                facecolor='w',
                alpha=1)
        for i in intervals[95]:
            ax1.axvspan(
                i.from_year +1,
                i.to_year -1,
                ymin=0.001,
                ymax=0.02,
                facecolor='k',
                alpha=1)
            ax1.axvspan(
                i.from_year,
                i.to_year,
                ymin=0.005,
                ymax=0.02,
                facecolor='w',
                alpha=1)

    else:
        for i in intervals[68]:
            ax1.axvspan(
                i.from_year,
                i.to_year,
                ymin=0,
                ymax=0.02,
                facecolor='k',
                alpha=0.5)
        for i in intervals[95]:
            ax1.axvspan(
                i.from_year,
                i.to_year,
                ymin=0,
                ymax=0.02,
                facecolor='k',
                alpha=0.5)

    # FIXME the following values 10 and 5 are arbitrary and could be probably
    # drawn from the f_m value itself, while preserving their ratio
    ax1.set_ybound(f_m - sigma_m * 15, f_m + sigma_m * 5)
    ax1.set_xbound(min(calibrated_age[:,0]),max(calibrated_age[:,0]))

    ax1.invert_xaxis()
    if BP != 'bp':
        ax1.set_xticklabels([int(item*-1+1950) for item in ax1.get_xticks().tolist()])

    if output:
        plt.savefig(output)


def stacked_plot(calibrated_ages, name='Stacked plot', oxcal=False, BP='ad', output=None):
    '''Plot multiple calibrated ages, vertically stacked.

    ``calibrated_ages`` is an iterable of CalAge objects.'''

    # Define the legend and descriptive text

    min_year, max_year = (50000, -50000)

    for calibrated_age in calibrated_ages:
        radiocarbon_sample_id = calibrated_age.radiocarbon_sample.id
        calibration_curve = calibrated_age.calibration_curve
        calibration_curve_title = calibration_curve.title
        intervals = calibrated_age.intervals
        if min_year > min(calibrated_age[:,0]):
            min_year = min(calibrated_age[:,0])
        if max_year < max(calibrated_age[:,0]):
            max_year = max(calibrated_age[:,0])

    if BP != 'bp':
        if min_year < 0 and max_year > 0:
            ad_bp_label = "BC/AD"
        elif min_year < 0 and max_year < 0:
            ad_bp_label = "BC"
        elif min_year > 0 and max_year > 0:
            ad_bp_label = "AD"
    else:
        ad_bp_label = "BP"

    numrows = len(calibrated_ages)
    fig, axs = plt.subplots(numrows, 1, sharex=True, figsize=(12, 2*numrows))
    plt.suptitle("{}".format(name))
    axs[0].invert_xaxis() # just once, because the axis is shared

    for n, calibrated_age in enumerate(calibrated_ages):
        ax = axs[n]
        _list = []
        if (len(calibrated_ages) -1) == n:
            #print(ax.get_xticks())
            for item in ax.get_xticks():
                print(1950 - int(item))
                _list.append(1950 - int(item))

        # Calendar Age

        ax.fill_between(
            calibrated_age[:,0],
            calibrated_age[:,1]*0,
            calibrated_age[:,1],
            facecolor='k',
            alpha=0.3,
            label='Calendar Age'
            )
        ax.plot(
            calibrated_age[:,0],
            calibrated_age[:,1],
            'k',
            alpha=0.6
            )
        ax.set_ybound(
            min(calibrated_age[:,1]),
            max(calibrated_age[:,1])*2
            )
        ax.set_xbound(min_year, max_year)

        # remove labels for Y axis - values are meaningless
        ax.get_yaxis().set_ticklabels('')

        # Legend
        plt.text(0.95, 0.85,'{0.radiocarbon_sample.id!s}'.format(calibrated_age),
         horizontalalignment='right',
         verticalalignment='center',
         transform = ax.transAxes,
         bbox=dict(facecolor='white', alpha=0.9, lw=0))

        # Confidence intervals
        for i in calibrated_age.intervals[95]:
            ax.axvspan(
                i.from_year,
                i.to_year,
                ymin=0.6,
                ymax=0.7,
                facecolor='k',
                alpha=0.4)
        for i in calibrated_age.intervals[68]:
            ax.axvspan(
                i.from_year,
                i.to_year,
                ymin=0.6,
                ymax=0.7,
                facecolor='k',
                alpha=1.0)
        if n + 1 == numrows:
            if BP != 'bp':
                plt.xlabel("Calibrated age ({})".format(ad_bp_label), y = 0.05) # out of plot boundaries :(
            else:
                plt.xlabel("Calibrated age (BP)", y = 0.05)

    if BP != 'bp':
        axs[0].set_xticklabels(_list)

    if output:
        plt.savefig(output, format="png")


def iplot(calibrated_ages, **kwds):
    '''A generic function for plotting in the IPython Notebook.'''

    try:
        # ugly, ugly hack
        calibrated_ages.intervals
    except AttributeError:
        stacked_plot(calibrated_ages, **kwds)
    else:
        single_plot(calibrated_ages, **kwds)
