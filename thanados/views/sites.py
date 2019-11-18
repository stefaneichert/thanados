from flask import render_template, g

from thanados import app

list_of_sites=app.config["SITE_LIST"]

# print(Data.get_sitelist())

if list_of_sites == 0:
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

             from thanados.entities s WHERE system_type = 'place' AND lat IS NOT NULL ) a;
                    """
else:
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
    g.cursor.execute(sql_site_list, {"sites": list_of_sites})
    site_list = g.cursor.fetchall()
    return render_template('/sites/sites.html', sitelist = site_list[0].sitelist)
