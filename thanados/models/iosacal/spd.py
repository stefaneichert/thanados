# -*- coding: utf-8 -*-
# filename: spd.py
# Copyright 2017 Mario Gutiérrez-Roig <mariogutierrezroig@gmail.com>
# Copyright 2020 Stefano Costa <steko@iosa.it>
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

import numpy as np

from thanados.models.iosacal.core import CalibrationCurve, RadiocarbonDetermination

def spdsum(spdlist, norm=True):
    """ Sums several SPDs stored in a list.

    Arguments:
        norm -- If 'True' final SPD will be normalized.

    """

    spd = spdlist[0].copy()

    maxi = np.max([np.max(np.array(x).T[0]) for x in spdlist])
    mini = np.min([np.min(np.array(x).T[0]) for x in spdlist])

    # Creates a void vector where perform the sum
    xrange = np.arange(mini, maxi + 1, 1)
    yrange = np.zeros((int)(maxi) + 1 - (int)(mini))

    for d in spdlist:
        # Reshapes every array by adding zeros at the head and tail
        y = np.lib.pad(
            d.T[1],
            (np.int(d.T[0][0] - mini), np.int(maxi - d.T[0][-1])),
            "constant",
            constant_values=0,
        )

        # Summing over all histogram
        yrange += y

    # Normalizating the SPD in calendar scale
    if norm == True:
        yrange = yrange / np.sum(yrange)

    spd.resize(len(xrange), 2, refcheck=False)

    spd.T[0] = xrange
    spd.T[1] = yrange

    spd.ndates = np.sum([x.ndates for x in spdlist])

    return spd


class SPD(np.ndarray):
    """ A Sum of Probability Distributions of calibrated dates """

    def __new__(cls, caldates, norm=True):
        """ Initializes the SPD class from calibrated dates

        Arguments:
            caldates -- List with all calibrated dates (after R.calibrate()) in a list
            norm -- If 'True' SPD will be normalized

        """

        # Finds maximum and minimum value of calibrated dates
        maxi = np.max([np.max(np.array(x).T[0]) for x in caldates])
        mini = np.min([np.min(np.array(x).T[0]) for x in caldates])

        # Creates a void vector where perform the sum
        xrange = np.arange(mini, maxi + 1, 1)
        yrange = np.zeros((int)(maxi) + 1 - (int)(mini))

        for d in caldates:
            # Disentangles and reverses the arrays
            x = np.array(d).T[0][::-1]
            y = np.array(d).T[1][::-1]

            # Reshapes every array by adding zeros at the head and tail
            yy = np.lib.pad(
                y,
                (np.int(x[0] - mini), np.int(maxi - x[-1])),
                "constant",
                constant_values=0,
            )

            # Summing over all histogram
            yrange += yy

        # Normalizating the SPD in calendar scale
        if norm == True:
            yrange = yrange / np.sum(yrange)

        obj = np.asarray(np.column_stack((xrange, yrange))).view(cls)
        obj.ndates = len(caldates)

        return obj

    def __array_finalize__(self, obj):
        # see InfoArray.__array_finalize__ for comments
        if obj is None:
            return
        self.ndates = getattr(obj, "ndates", None)

    def normalize(self):
        """ Normalizes the SPD """

        y = np.array(self.T[1])

        self.T[1] /= np.sum(y)

    def taphcorr(self, function="Surovell", factor=1):
        """ Performs a taphonomic correction over the SPD

        Taphonomic Correction can be made according two different curves
        indicated by the variable 'function': Surovell's or Williams' correction:

        Surovell's correction:

            n(t) = 5.726442 * 10^6 * (t + 2176.4)^-1.3925309

        Surovell, T. A., Finley, J. B., Smith, G. M., Brantingham, P. J.,
        & Kelly, R. (2009). Correcting temporal frequency distributions for
        taphonomic bias. Journal of Archaeological Science, 36(8), 1715-1724.

        Williams' correction:

            n(t) = 2.107 * 10^7 * (t + 2754)^-1.526

        Williams, A. N. (2012). The use of summed radiocarbon probability
        distributions in archaeology: a review of methods.
        Journal of Archaeological Science, 39(3), 578-589.

        The taphonomic correction is not applied homogeneously, but taking into
        account the percentage of open sites, rock shelters and caves samples
        in each age. This percentage correction is given by the vector
        "factor". If factor=None, then correction is applied homogeneously.

        Arguments:
            factor -- Percentage of correction between 0 and 1.
        """

        corr = self.copy()

        if function == "Surovell":
            taph = 5726442 * np.power((self.T[0] + 2176.4), -1.3925309)
        elif function == "Williams":
            taph = 21070000 * np.power((self.T[0] + 2754), -1.526)
        else:
            print("ERROR: Invalid argument for 'function' variable")
            sys.exit()

        corr_y = [c / t if t > 0 else c for c, t in zip(np.array(self.T[1]), taph)]
        corr_y = np.array(corr_y) * np.sum(self.T[1]) / np.sum(corr_y)

        corr.T[1] = corr_y * factor + (1. - factor) * self.T[1]

        return corr

    def rollmean(self, m):
        """ Performs a Rolling Mean of a 2*m+1 window (-m to +m)

        Note:
         - Returns a SPD of smaller size.
         - Variable m should always be greater than 0

        """

        a = self.copy()
        n = 2 * m + 1
        ret = np.cumsum(a.T[1], dtype=float)
        ret[n:] = ret[n:] - ret[:-n]
        a.T[1][m:-m] = ret[n - 1:] / n

        return a[m:-m]

    def simdates(self, N, calcurve_name, c14std, seed=0):
        """ Simulated dates drawn from SPD curve

        Performs a Bootstrap reseampling on the original SPD and generates a
        new list of simulated dates after backcalibrating. The errors are
        assigned at random from the original distribution.

        Arguments:
            N -- Number of dates to simulate
            seed -- Seed for random generator (if any)
            calcurve_name -- Calibration curve name for backcalibrating
            c14std -- List with all original errors for generating the simulated
                      std.
        """

        np.random.seed = seed
        SPDcum = np.cumsum(self.T[1])

        calcurve = CalibrationCurve(calcurve_name)

        dates = []
        for i in range(N):
            ran = np.random.random()
            idx = (np.abs(SPDcum - ran)).argmin()
            date = self[idx][0]

            idx2 = (np.abs(calcurve.T[0] - date)).argmin()
            c14date = calcurve[idx2][1]

            std = np.random.choice(c14std)
            idname = "sim_" + str(i)
            dates.append([idname, c14date, std])

        return dates

    def simSPD(self, calcurve_name, c14std, seed=0):
        """ Simulated SPD curve generated from the original SPD

        Performs a Bootstrap reseampling on the original SPD and generates a
        new list of simulated dates that are backcalibrated in the 14C axis,
        then those dates are calibrated again for constructing the SPD. The
        number of simulated dates is the same than the original curve.

        Arguments:
            calcurve_name -- Calibration curve name for backcalibrating
            c14std -- List with all original errors for generating the simulated
                      std.
            seed -- Seed for random generator (if any)
        """

        simdateslist = self.simdates(self.ndates, calcurve_name, c14std, seed)
        simdates = [RadiocarbonDetermination(x[1], x[2], x[0]) for x in simdateslist]

        # Calibrated date-by-date in order to save memory
        caldates = []
        for x in simdates:
            cal_r = x.calibrate(calcurve_name, norm=True)
            del cal_r.calibration_curve
            del cal_r.radiocarbon_sample
            del cal_r.intervals
            del cal_r.median
            caldates.append(cal_r)

        simulatedSPD = SPD(caldates)

        return simulatedSPD


class FreqHist(np.ndarray):
    """ A Frequency Histogram of calibrated dates """

    def __new__(cls, caldates, bins):
        """ Initializes the FreqHist class from calibrated dates

        Arguments:
            caldates -- List with all calibrated dates (after R.calibrate()) in a list
            binwidth -- Array with the bins

        """

        meds = [x.median for x in caldates]

        freqs, bins = np.histogram(meds, bins)

        avbins = 0.5 * (bins[1:] + bins[:-1])

        obj = np.asarray(np.column_stack((avbins, freqs))).view(cls)

        return obj

    def taphcorr(self, function="Surovell", factor=None):
        """ Performs a taphonomic correction over the Frequency Histogram

        Taphonomic Correction can be made according two different curves
        indicated by the variable 'function': Surovell's or Williams' correction:

        Surovell's correction:

            n(t) = 5.726442 * 10^6 * (t + 2176.4)^-1.3925309

        Surovell, T. A., Finley, J. B., Smith, G. M., Brantingham, P. J.,
        & Kelly, R. (2009). Correcting temporal frequency distributions for
        taphonomic bias. Journal of Archaeological Science, 36(8), 1715-1724.

        Williams' correction:

            n(t) = 2.107 * 10^7 * (t + 2754)^-1.526

        Williams, A. N. (2012). The use of summed radiocarbon probability
        distributions in archaeology: a review of methods.
        Journal of Archaeological Science, 39(3), 578-589.

        The taphonomic correction is not applied homogeneously, but taking into
        account the percentage of open sites, rock shelters and caves samples
        in each age. This percentage correction is given by the vector
        "factor". If factor=None, then correction is applied homogeneously.

        Arguments:
            factor -- Percentage of correction in each bin.
        """

        corr = self.copy()

        if function == "Surovell":
            taph = 5726442 * np.power((self.T[0] + 2176.4), -1.3925309)
        elif function == "Williams":
            taph = 21070000 * np.power((self.T[0] + 2754), -1.526)
        else:
            print("ERROR: Invalid argument for 'function' variable")
            sys.exit()

        if factor is None:
            taph = np.array(taph)
        else:
            taph = np.array(taph) * factor

        corr_y = [c / t if t > 0 else c for c, t in zip(np.array(self.T[1]), taph)]
        corr_y = np.array(corr_y) * np.sum(self.T[1]) / np.sum(corr_y)

        corr.T[1] = corr_y

        return corr
