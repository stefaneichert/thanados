from flask import render_template, g

from thanados import app
from thanados.models.entity import Data

sql_site_list = """
        SELECT jsonb_agg(a) as sitelist
        FROM (
                 SELECT s.child_name     AS name,
                        s.description    AS description,
                        s.begin_from     AS begin,
                        s.end_to         AS end,
                        s.child_id       AS id,
                        s.typename       AS type,
                        s.path,
                        s.lat,
                        s.lon,
                        COUNT(s.child_id) AS graves

                 FROM thanados.entities s LEFT JOIN thanados.graves g ON s.child_id = g.parent_id
                 WHERE s.system_type = 'place' AND s.lat IS NOT NULL AND g.child_id != 0 AND s.child_id IN  %(sites)s 
                 GROUP BY s.child_name, s.description, s.begin_from, s.end_to, s.child_id, s.typename, s.path, s.lat, s.lon) a;
        """


@app.route('/sites')
def sites():
    g.cursor.execute(sql_site_list, {"sites": Data.get_site_ids()})
    site_list = g.cursor.fetchall()
    return render_template('/sites/sites.html', sitelist=site_list[0].sitelist)
