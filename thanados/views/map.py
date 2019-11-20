from flask import render_template, g

from thanados import app
from thanados.models.entity import Data


# @login_required
@app.route('/map/<int:object_id>')
def map(object_id: int):
    myjson = Data.get_data(object_id)
    g.cursor.execute('SELECT * FROM thanados.typesjson;')
    types = g.cursor.fetchall()
    return render_template('map/index.html',
                           myjson=myjson[0].data,
                           object_id=object_id,
                           typesjson=types[0].types)
