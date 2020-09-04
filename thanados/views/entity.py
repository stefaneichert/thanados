from flask import json, render_template, g

from thanados import app
from thanados.models.entity import Data


@app.route('/entity/<int:object_id>')
@app.route('/entity/<int:object_id>/<format_>')
def entity_view(object_id: int, format_=None):
    system_type = Data.get_system_type(object_id)
    place_id = Data.get_parent_place_id(object_id)
    data = Data.get_data(place_id)[0].data
    entity = {}

    sql = """
    SELECT name, description FROM model.entity WHERE id = %(id)s 
    """
    g.cursor.execute(sql, {"id": object_id})
    result = g.cursor.fetchone()
    entity['name'] = result.name
    entity['description'] = result.description


    print(object_id)

    if format_ == 'json':
        return json.dumps(data)
    if format_ == 'dashboard':
        network = Data.getNetwork(object_id)
        return render_template('entity/dashboard.html', place_id=place_id, object_id=object_id,
                           mysitejson=data, system_type=system_type, entity=entity, network=network)
    return render_template('entity/view.html', place_id=place_id, object_id=object_id,
                           mysitejson=data, system_type=system_type)
