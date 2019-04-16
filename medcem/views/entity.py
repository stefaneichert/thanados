from flask import render_template

from medcem import app
from medcem.models.entity import Data


@app.route('/entity/view/<int:object_id>')
def entity_view(object_id):
    system_type = Data.get_system_type(object_id)
    place_id = Data.get_parent_place_id(object_id)
    return render_template('entity/view.html', place_id=place_id, object_id=object_id,
                           mysitejson=Data.get_data(place_id)[0].data, system_type=system_type)
