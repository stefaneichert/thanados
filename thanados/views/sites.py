from flask import render_template, g

from thanados import app
from thanados.models.entity import Data


@app.route('/sites')
def sites():
    site_list = Data.get_list()
    return render_template('/sites/sites.html', sitelist=site_list[0].sitelist)
