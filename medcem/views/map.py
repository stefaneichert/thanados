from flask import render_template, g

from medcem import app


@app.route('/map')
@app.route('/map/index')
def map_index():
    sql_thunau = """
        SELECT data FROM jsonprepare.tbl_medcem_data WHERE id = 50505;
    """
    g.cursor.execute(sql_thunau)
    thunau = g.cursor.fetchall()

    sql_pohansko = """
        SELECT data FROM jsonprepare.tbl_medcem_data WHERE id = 50497;
        """
    g.cursor.execute(sql_pohansko)
    pohansko = g.cursor.fetchall()

    sql_types = """
            SELECT * FROM jsonprepare.typesjson;
            """
    g.cursor.execute(sql_types)
    types = g.cursor.fetchall()


    return render_template('map/index.html', pohanskojson=pohansko[0].data, thunaujson=thunau[0].data, typesjson=types[0].types)

