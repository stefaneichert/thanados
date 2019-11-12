from flask import render_template, g
from flask_login import login_required

from thanados import app
from thanados.models.entity import Data

@app.route('/map/<int:object_id>')
#@login_required#
def map(object_id: int, format_=None):
    myjson = Data.get_data(object_id)
    sql_types = """
            SELECT * FROM thanados.typesjson;
            """
    g.cursor.execute(sql_types)
    types = g.cursor.fetchall()

    return render_template('map/index.html',
                           myjson = myjson[0].data,
                           object_id=object_id,
                           typesjson=types[0].types)

