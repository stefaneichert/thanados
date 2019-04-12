from flask import render_template, g

from medcem import app
from medcem.models.entity import Data


@app.route('/entity/view/<int:site_id>/<int:object_id>')
def entity_view(site_id, object_id):
    mysite = Data.get_data(site_id)

    sql = """
                  SELECT system_type FROM model.entity WHERE id = %(object_id)s;
                  """
    g.cursor.execute(sql, {"object_id": object_id})
    systemtype = g.cursor.fetchall()

    return render_template('entity/view.html', site_id=site_id, object_id=object_id, mysitejson=mysite[0].data, system_type=systemtype[0].system_type)
