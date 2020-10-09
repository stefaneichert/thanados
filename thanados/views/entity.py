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

    findtree = [{
        'name': 'finds',
        'id': 13368,
        'size': 0
    }]

    sqlBubblePrepare = """
    DROP TABLE IF EXISTS thanados.typeBubble;
    CREATE TABLE thanados.typeBubble AS
    WITH RECURSIVE supertypes AS (
            	SELECT
            		name,
            	       name_path,
            	       parent_id,
            		id,
            		0 as count
            	FROM
            		thanados.types_all
            	WHERE
            		id IN (SELECT id from thanados.types_all t JOIN thanados.searchdata s ON t.id = s.type_id WHERE t.topparent = '13368' AND s.site_id = %(site_id)s GROUP BY name, id, parent_id)
            	UNION
            		SELECT
            		       l.name,
            	       l.name_path,
            		l.parent_id,
            		l.id,
            		0 as count
            	FROM
            		thanados.types_all l JOIN supertypes s ON s.parent_id = l.id
            ) SELECT
            	*
            FROM
            	supertypes ORDER BY name_path;

    UPDATE thanados.typeBubble t SET count = l.size FROM (SELECT name, id, COUNT(type_id) AS size FROM thanados.types_all t LEFT JOIN thanados.searchdata s ON t.id = s.type_id WHERE s.site_id = %(site_id)s GROUP BY name, id) l WHERE t.id = l.id;
    """
    g.cursor.execute(sqlBubblePrepare, {'site_id': object_id})

    def getBubblechildren(id, node):
        sql_getChildren = """
                        SELECT name, id, count AS size FROM thanados.typeBubble t WHERE t.parent_id = %(id)s;
                    """
        g.cursor.execute(sql_getChildren, {'id': id, 'site_id': object_id})
        results = g.cursor.fetchall()
        if results:
            node['children'] = []
            for row in results:
                if row.size:
                    size = row.size
                else:
                    size = 0
                currentnode = {'name': row.name,
                               'id': row.id,
                               'size': size}
                node['children'].append(currentnode)
                getBubblechildren(row.id, currentnode)

    getBubblechildren(findtree[0]['id'], findtree[0])

    if format_ == 'json':
        return json.dumps(data)

    if format_ == 'network':
        network = Data.getNetwork(object_id)
        return render_template('entity/network.html', place_id=place_id, object_id=object_id,
                               mysitejson=data, system_type=system_type, entity=entity, network=network)
    if format_ == 'dashboard':
        network = Data.getNetwork(object_id)
        wordcloud = Data.get_wordcloud(object_id)
        return render_template('entity/dashboard.html', network=network, entity=entity, wordcloud=wordcloud,
                               mysitejson=data, findBubble=findtree)

    return render_template('entity/view.html', place_id=place_id, object_id=object_id,
                           mysitejson=data, system_type=system_type)
