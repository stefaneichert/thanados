#! /usr/bin/env python
# -*- coding: utf-8 -*-
# filename: cli.py
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


import click

from thanados.models.iosacal import core, plot, text


@click.command()
@click.option(
    "-d",
    "--date",
    help="non calibrated radiocarbon BP date for sample",
    required=True,
    type=int,
    multiple=True,
)
@click.option(
    "-s",
    "--sigma",
    help="standard deviation for date",
    required=True,
    type=int,
    multiple=True,
)
@click.option(
    "--id", type=str, multiple=True, required=True, help="sample identification"
)
@click.option(
    "-p",
    "--plot",
    "plot_",
    type=bool,
    default=False,
    is_flag=True,
    help="output results to graphic plot",
)
@click.option(
    "-c",
    "--curve",
    type=str,
    default="intcal20",
    help="calibration curve (either as shortname or path to file)",
)
@click.option(
    "-o", "--oxcal", type=bool, default=False, help="draw plots more OxCal-like looking"
)
@click.option(
    "-n", "--name", type=click.Path(), default="iosacal", help="name of output plot"
)
@click.option(
    "-1",
    "--single/--no-single",
    type=bool,
    default=True,
    help="generate single plots for each sample",
)
@click.option(
    "-m",
    "--stacked",
    type=bool,
    default=False,
    is_flag=True,
    help="generate stacked plot with all samples",
)
@click.option(
    "--bp",
    "BP",
    flag_value="bp",
    default=True,
    help="express dates in Calibrated BP Age",
)
@click.option(
    "--ad", "BP", flag_value="ad", help="express dates in Calibrated BC/AD Calendar Age"
)
@click.option(
    "--ce",
    "BP",
    flag_value="ce",
    help="express dates in Calibrated BCE/CE Calendar Age",
)
def main(date, sigma, id, plot_, curve, oxcal, name, single, stacked, BP):
    """Main program procedure.

    By default produces text output to stdout for each sample."""

    if not (len(date) == len(sigma) == len(id)):
        raise click.BadParameter(
            "Number of dates, sigma and id must be equal",
            param_hint=["date", "sigma", "id"],
        )

    curve = core.CalibrationCurve(curve)
    calibrated_ages = []
    for d, s, id in zip(date, sigma, id):
        rs = core.R(d, s, id)
        ca = rs.calibrate(curve)
        calibrated_ages.append(ca)
        if plot_ and single is True:
            outputname = "{}_{:d}_{:d}.pdf".format(id, d, s)
            plot.single_plot(ca, oxcal=oxcal, output=outputname, BP=BP)
        else:
            click.echo(text.single_text(ca, BP))
    if plot_ and stacked is True:
        plot.stacked_plot(
            calibrated_ages, oxcal=oxcal, name=name, output="{}.pdf".format(name),
        )
