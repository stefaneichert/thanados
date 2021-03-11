from flask import render_template, g

from thanados import app
from thanados.models.entity import Data


@app.route('/')
def index():
    site_list = Data.get_list()

    sql = """
    SELECT '['
|| (SELECT count(child_id)::TEXT FROM thanados.EntCount WHERE system_class = 'place' 
        AND site_id IN %(site_ids)s AND Path LIKE 'Place > Burial Site%%') || ','
|| (SELECT count(child_id)::TEXT FROM thanados.EntCount WHERE system_class = 'feature' 
        AND site_id IN %(site_ids)s AND Path LIKE 'Feature > Grave%%') || ','
|| (SELECT count(child_id)::TEXT FROM thanados.EntCount WHERE system_class = 'stratigraphic_unit' 
        AND site_id IN %(site_ids)s AND Path LIKE 'Stratigraphic Unit > Burial%%') || ','
|| (SELECT count(child_id)::TEXT FROM thanados.EntCount WHERE system_class = 'find' 
        AND site_id IN %(site_ids)s AND Path LIKE 'Find >%%') || ','
|| (SELECT count(child_id)::TEXT FROM thanados.EntCount WHERE system_class = 'human_remains' 
        AND site_id IN %(site_ids)s AND Path LIKE 'Human Remains >%%') || ']'
    """

    g.cursor.execute(sql, {'site_ids': tuple(g.site_list)})
    counts = g.cursor.fetchone()

    return render_template("/index/index.html", sitelist=site_list[0].sitelist, entitycount=counts[0])
