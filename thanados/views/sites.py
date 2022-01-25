from flask import render_template, g
from flask_login import current_user, login_required


from thanados import app
from thanados.models.entity import Data


@app.route('/sites')
@login_required
def sites():
    site_list = Data.get_list()
    case_studies = app.config["DOMAIN_TYPES"]



    return render_template('/sites/sites.html', sitelist=site_list[0].sitelist)
