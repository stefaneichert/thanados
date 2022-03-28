import json, os
from flask import render_template, g
from flask_login import current_user, login_required

from thanados import app
from thanados.models.entity import Data


@app.route('/')
def index():
    site_list = Data.get_list()

    f = open('./instance/domains.json')

    data = json.load(f)
    f.close()

    sql = """
    SELECT '['
|| (SELECT count(child_id)::TEXT FROM thanados.EntCount WHERE openatlas_class_name = 'place' 
        AND site_id IN %(site_ids)s AND Path LIKE 'Place > Burial Site%%') || ','
|| (SELECT count(child_id)::TEXT FROM thanados.EntCount WHERE openatlas_class_name = 'feature' 
        AND site_id IN %(site_ids)s AND Path LIKE 'Feature > Grave%%') || ','
|| (SELECT count(child_id)::TEXT FROM thanados.EntCount WHERE openatlas_class_name = 'stratigraphic_unit' 
        AND site_id IN %(site_ids)s AND Path LIKE 'Stratigraphic unit > Burial%%') || ','
|| (SELECT count(child_id)::TEXT FROM thanados.EntCount WHERE openatlas_class_name = 'artifact' 
        AND site_id IN %(site_ids)s AND Path LIKE 'Artifact >%%') || ','
|| (SELECT count(child_id)::TEXT FROM thanados.EntCount WHERE openatlas_class_name = 'human_remains' 
        AND site_id IN %(site_ids)s AND Path LIKE 'Human remains >%%') || ']'
    """

    g.cursor.execute(sql, {'site_ids': tuple(g.site_list)})
    counts = g.cursor.fetchone()

    return render_template("/index/index.html", isIndex=True, domains=data, sitelist=site_list[0].sitelist, entitycount=counts[0])
