from flask import render_template, g

from thanados import app
from thanados.models.entity import Data

sql_site_list = """
        SELECT jsonb_agg(a) as sitelist
        FROM (
                 SELECT child_name              AS name,
                        description 		AS description,
                        begin_from              AS begin,
                        end_to                  AS end,
                        child_id                AS id,
                        typename                AS type,
                        path,
                        lat,
                        lon

                 from thanados.entities s WHERE system_type = 'place' AND s.child_id IN  %(sites)s AND lat IS NOT NULL ) a;
                        """


@app.route('/sites')
def sites():
    g.cursor.execute(sql_site_list, {"sites": Data.get_site_ids()})
    site_list = g.cursor.fetchall()
    return render_template('/sites/sites.html', sitelist = site_list[0].sitelist)
