from flask import render_template, g

from medcem import app
from medcem.models.entity import Data

@app.route('/map')
@app.route('/map/index')
def map_index():
    thunau = Data.get_data(50505)
    pohansko = Data.get_data(50497)
    sql_types = """
            SELECT * FROM jsonprepare.typesjson;
            """
    g.cursor.execute(sql_types)
    types = g.cursor.fetchall()

    return render_template('map/index.html',
                           pohanskojson=pohansko[0].data,
                           thunaujson=thunau[0].data,
                           typesjson=types[0].types)

