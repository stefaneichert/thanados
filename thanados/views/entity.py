from flask import render_template, json
from flask_login import login_required

from thanados import app
from thanados.models.entity import Data


@app.route('/entity/view/<int:object_id>')
@app.route('/entity/view/<int:object_id>/<format_>')
#@login_required#
def entity_view(object_id: int, format_=None):
    system_type = Data.get_system_type(object_id)
    place_id = Data.get_parent_place_id(object_id)
    data = Data.get_data(place_id)[0].data
    if format_ == 'json':
        return json.dumps(data)
    return render_template('entity/view.html', place_id=place_id, object_id=object_id,
                           mysitejson=data, system_type=system_type)
