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
        'SELECT DISTINCT t.id, s.openatlas_class_name FROM thanados.typesforjson t LEFT JOIN thanados.searchdata s ON t.id::INT = s.type_id::INT WHERE s.site_id = %(id)s',
        {'id': object_id})
    jsontypes = g.cursor.fetchall()
    availabletypes = {
        'gravetypes': [],
        'burialtypes': [],
        'findtypes': [],
        'bonetypes': []
    }
    for row in jsontypes:
        if row.openatlas_class_name == 'feature':
            availabletypes['gravetypes'].append(row.id)
        if row.openatlas_class_name == 'stratigraphic_unit':
            availabletypes['burialtypes'].append(row.id)
        if row.openatlas_class_name == 'artifact':
            availabletypes['findtypes'].append(row.id)
        if row.openatlas_class_name == 'human_remains':
            availabletypes['bonetypes'].append(row.id)

    site_list = Data.get_list()

    return render_template('map/map.html',
                           myjson=myjson[0].data,
                           object_id=object_id,
                           typesjson=types[0].types,
                           availables=availabletypes,
                           site_list=site_list,
                           leafletVersion="1.4")
