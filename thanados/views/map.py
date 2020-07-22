from flask import render_template, g

from thanados import app
from thanados.models.entity import Data


# @login_required
@app.route('/map/<int:object_id>')
def map(object_id: int):
    myjson = Data.get_data(object_id)
    g.cursor.execute('SELECT * FROM thanados.typesjson;')
    types = g.cursor.fetchall()

    g.cursor.execute(
        'SELECT DISTINCT t.id, s.system_type FROM thanados.typesforjson t LEFT JOIN thanados.searchdata s ON t.id::INT = s.type_id::INT WHERE s.site_id = %(id)s',
        {'id': object_id})
    jsontypes = g.cursor.fetchall()
    availabletypes = {
        'gravetypes': [],
        'burialtypes': [],
        'findtypes': [],
        'bonetypes': []
    }
    for row in jsontypes:
        print(row)
        if row.system_type == 'feature':
            availabletypes['gravetypes'].append(row.id)
        if row.system_type == 'stratigraphic unit':
            availabletypes['burialtypes'].append(row.id)
        if row.system_type == 'find':
            availabletypes['findtypes'].append(row.id)
        if row.system_type == 'human remains':
            availabletypes['bonetypes'].append(row.id)

    return render_template('map/map.html',
                           myjson=myjson[0].data,
                           object_id=object_id,
                           typesjson=types[0].types,
                           availables=availabletypes)
