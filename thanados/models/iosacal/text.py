# -*- coding: utf-8 -*-
# filename: text.py
# Copyright 2018 Stefano Costa <steko@iosa.it>
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

from textwrap import indent

import thanados.models.iosacal

def single_text(calibrated_age, BP='bp'):
    '''Output calibrated age as simple Markdown text to the terminal.'''

    formatted_intervals = dict()
    for a, i in calibrated_age.intervals.items():
        formatted_intervals[a] = indent('{:{fmt}}'.format(i, fmt=BP), '* ')

    output = '''
# {0.radiocarbon_sample.id}

Calibration of {0.radiocarbon_sample.id}: {0.radiocarbon_sample.date} ± {0.radiocarbon_sample.sigma} BP

## Calibrated age

{0.calibration_curve.title}

### 68.2% probability

{1[68]}

### 95.4% probability

{1[95]}

----

IOSACal v{2}

'''.format(calibrated_age, formatted_intervals, thanados.models.iosacal.__VERSION__)

    return output
