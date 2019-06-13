from flask import render_template

from medcem import app
from medcem.models.entity import Data


@app.route('/charts')
def charts():
    depth = Data.get_depth()
    sex = Data.get_sex()
    orientation = Data.get_orientation()
    return render_template('charts/charts.html', depth_data=depth[0].depth,
                           orientation_data=orientation[0].orientation, sex_data=sex[0].sex)
