from flask import render_template, g

from thanados import app


@app.route('/sites')
def sites():
    sql_sitelist = """
                SELECT * FROM thanados.sitelist;
                """
    g.cursor.execute(sql_sitelist)
    sitelist = g.cursor.fetchall()

    return render_template('/sites/sites.html', sitelist = sitelist[0].sitelist)
