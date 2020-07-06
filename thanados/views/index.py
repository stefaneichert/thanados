from flask import render_template, g

from thanados import app
from thanados.models.entity import Data


@app.route('/')
@app.route('/index')
def index():
    site_list = Data.get_list()

    sql0 = """
    DROP TABLE IF EXISTS thanados.EntCount;
    CREATE TABLE thanados.EntCount AS
    SELECT * FROM thanados.searchdata WHERE site_id IN %(site_ids)s
    """

    g.cursor.execute(sql0, {'site_ids': tuple(g.site_list)})

    sql = """
    SELECT '['
|| (SELECT count(child_id)::TEXT FROM thanados.EntCount WHERE system_type = 'place' AND Path LIKE 'Place > Burial Site%') || ','
|| (SELECT count(child_id)::TEXT FROM thanados.EntCount WHERE system_type = 'feature' AND Path LIKE 'Feature > Grave%') || ','
|| (SELECT count(child_id)::TEXT FROM thanados.EntCount WHERE system_type = 'stratigraphic unit' AND Path LIKE 'Stratigraphic Unit > Burial%') || ','
|| (SELECT count(child_id)::TEXT FROM thanados.EntCount WHERE system_type = 'find' AND Path LIKE 'Find >%') || ']'
    """

    g.cursor.execute(sql)
    counts = g.cursor.fetchone()

    return render_template("/index/index.html", sitelist=site_list[0].sitelist, entitycount=counts[0])
