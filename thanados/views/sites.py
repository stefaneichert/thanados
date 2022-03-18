from flask import render_template, g
from flask_login import current_user, login_required
import json, os

from thanados import app
from thanados.models.entity import Data


@app.route('/sites')
@app.route('/sites/<domain_>')
def sites(domain_=None):
    site_list = Data.get_list()

    case_studies = app.config["DOMAIN_TYPES"]

    f = open('./instance/domains.json')

    data = json.load(f)

    nameArray = []

    for i in data:
        nameArray.append(i['name'])
    f.close()

    if domain_ and str(domain_) in nameArray:
        print(domain_)
        for arr in data:
            if arr['name'] == str(domain_):
                id_ = arr['id']
                print(id_)
        return render_template('/sites/sites.html',
                               sitelist=site_list[0].sitelist, domain=id_)

    return render_template('/sites/sites.html', sitelist=site_list[0].sitelist,
                           domain=0)
