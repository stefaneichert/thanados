from flask import render_template, g

from medcem import app
from medcem.models.entity import Data

@app.route('/map/<int:object_id>')
def map(object_id: int, format_=None):
    myjson = Data.get_data(object_id)
    sql_types = """
            SELECT * FROM jsonprepare.typesjson;
            """
    g.cursor.execute(sql_types)
    types = g.cursor.fetchall()

    return render_template('map/index.html',
                           myjson = myjson[0].data,
                           object_id=object_id,
                           typesjson=types[0].types)

