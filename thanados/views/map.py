from flask import render_template, g
from flask_login import current_user, login_required


from thanados import app
from thanados.models.entity import Data


@app.route('/map/<int:object_id>')
def map(object_id: int):
    myjson = Data.get_data(object_id)
    g.cursor.execute('SELECT * FROM devill.typesjson;')
    types = g.cursor.fetchall()

    g.cursor.execute(
        'SELECT DISTINCT t.id, s.openatlas_class_name FROM devill.typesforjson t LEFT JOIN devill.searchdata s ON t.id::INT = s.type_id::INT WHERE s.site_id = %(id)s',
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

    sql = """
        SELECT JSONB_AGG(jsonb_strip_nulls(JSONB_BUILD_OBJECT(
        'place_id', l.range_id,
        'name', e.name,
        'image_id', m.image_id,
        'bounding_box', m.bounding_box::jsonb
                 ))) as bbox
        FROM web.map_overlay m
                 JOIN model.entity e ON m.image_id = e.id JOIN model.link l ON l.domain_id = m.image_id JOIN devill.files f ON f.id = e.id
        AND e.openatlas_class_name = 'file' AND  l.property_code = 'P67' AND l.range_id =  %(id)s
                 """

    g.cursor.execute(sql, {'id': object_id})
    result = g.cursor.fetchone()
    overlays = []

    if result.bbox:
        overlays = result.bbox

    print(overlays)

    return render_template('map/map.html',
                           myjson=myjson[0].data,
                           object_id=object_id,
                           typesjson=types[0].types,
                           availables=availabletypes,
                           site_list=site_list,
                           overlays=overlays,
                           leafletVersion="1.4")
