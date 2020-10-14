import ast

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
    g.cursor.execute(sqlBubblePrepare, {'site_id': place_id})

    def getBubblechildren(id, node):
        sql_getChildren = """
                        SELECT name, id, count AS size FROM thanados.typeBubble t WHERE t.parent_id = %(id)s;
                    """
        g.cursor.execute(sql_getChildren, {'id': id, 'site_id': place_id})
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
        def getDims(_dim):
            sql_dim = """
        
            SELECT 
                parent_id                                  AS "site_id",
                site_name                                  AS "label",
                string_to_array('0-20, 20-40, 40-60, 60-80, 80-100, 100-120, 120-140, 140-160, 160-180, 180-200, 200-220, 220-240, 240-260, 260-280, 280-300, 300-320, 320-340, 340-360, 360-380, 380-400, 400-420, 420-440, 440-460, 460-480, 480-500, 500-520, 520-540, 540-560, 560-580, 580-600, over 600', ',') AS labels,
                string_to_array(count(*) FILTER (WHERE VALUE <= 20) || ',' ||
                count(*) FILTER (WHERE VALUE > 20 AND VALUE <= 40) || ',' ||
                count(*) FILTER (WHERE VALUE > 40 AND VALUE <= 60) || ',' ||
                count(*) FILTER (WHERE VALUE > 60 AND VALUE <= 80) || ',' ||
                count(*) FILTER (WHERE VALUE > 80 AND VALUE <= 100) || ',' ||
                count(*) FILTER (WHERE VALUE > 100 AND VALUE <= 120) || ',' ||
                count(*) FILTER (WHERE VALUE > 120 AND VALUE <= 140) || ',' ||
                count(*) FILTER (WHERE VALUE > 140 AND VALUE <= 160) || ',' ||
                count(*) FILTER (WHERE VALUE > 160 AND VALUE <= 180) || ',' ||
                count(*) FILTER (WHERE VALUE > 180 AND VALUE <= 200) || ',' ||
                count(*) FILTER (WHERE VALUE > 200 AND VALUE <= 220) || ',' ||
                count(*) FILTER (WHERE VALUE > 220 AND VALUE <= 240) || ',' ||
                count(*) FILTER (WHERE VALUE > 240 AND VALUE <= 260) || ',' ||
                count(*) FILTER (WHERE VALUE > 260 AND VALUE <= 280) || ',' ||
                count(*) FILTER (WHERE VALUE > 280 AND VALUE <= 300) || ',' ||
                count(*) FILTER (WHERE VALUE > 300 AND VALUE <= 320) || ',' ||
                count(*) FILTER (WHERE VALUE > 320 AND VALUE <= 340) || ',' ||
                count(*) FILTER (WHERE VALUE > 340 AND VALUE <= 360) || ',' ||
                count(*) FILTER (WHERE VALUE > 360 AND VALUE <= 380) || ',' ||
                count(*) FILTER (WHERE VALUE > 380 AND VALUE <= 400) || ',' ||
                count(*) FILTER (WHERE VALUE > 300 AND VALUE <= 420) || ',' ||
                count(*) FILTER (WHERE VALUE > 420 AND VALUE <= 440) || ',' ||
                count(*) FILTER (WHERE VALUE > 440 AND VALUE <= 460) || ',' ||
                count(*) FILTER (WHERE VALUE > 460 AND VALUE <= 480) || ',' ||
                count(*) FILTER (WHERE VALUE > 480 AND VALUE <= 500) || ',' ||
                count(*) FILTER (WHERE VALUE > 500 AND VALUE <= 520) || ',' ||
                count(*) FILTER (WHERE VALUE > 520 AND VALUE <= 540) || ',' ||
                count(*) FILTER (WHERE VALUE > 540 AND VALUE <= 560) || ',' ||
                count(*) FILTER (WHERE VALUE > 560 AND VALUE <= 580) || ',' ||
                count(*) FILTER (WHERE VALUE > 580 AND VALUE <= 600) || ',' ||
                count(*) FILTER (WHERE VALUE > 600) , ',')::int[] AS data

                FROM (
                     SELECT g.parent_id,
                            s.name AS site_name,
                            d.value::double precision
                     FROM thanados.tbl_sites s
                              JOIN thanados.graves g ON g.parent_id = s.id
                              JOIN thanados.dimensiontypes d ON g.child_id = d.entity_id
                     WHERE d.name = %(dim)s AND g.parent_id = %(place_id)s
                 ) v
                
                GROUP BY parent_id, site_name;
            """

            g.cursor.execute(sql_dim, {'place_id': place_id, 'dim': _dim})
            result = g.cursor.fetchone()
            if result:
                _data = {"labels": result.labels,
                         "datasets": result.data}
                return _data
            else:
                return {"labels": [],
                        "datasets": []}

        def getDegs():
            sql_deg = """

            SELECT 
                parent_id                                  AS "site_id",
                site_name                                  AS "label",
                string_to_array('0-20, 20-40, 40-60, 60-80, 80-100, 100-120, 120-140, 140-160, 160-180, 180-200, 200-220, 220-240, 240-260, 260-280, 280-300, 300-320, 320-340, 340-360', ',') AS labels,
                string_to_array(count(*) FILTER (WHERE VALUE <= 20) || ',' ||
                count(*) FILTER (WHERE VALUE > 20 AND VALUE <= 40) || ',' ||
                count(*) FILTER (WHERE VALUE > 40 AND VALUE <= 60) || ',' ||
                count(*) FILTER (WHERE VALUE > 60 AND VALUE <= 80) || ',' ||
                count(*) FILTER (WHERE VALUE > 80 AND VALUE <= 100) || ',' ||
                count(*) FILTER (WHERE VALUE > 100 AND VALUE <= 120) || ',' ||
                count(*) FILTER (WHERE VALUE > 120 AND VALUE <= 140) || ',' ||
                count(*) FILTER (WHERE VALUE > 140 AND VALUE <= 160) || ',' ||
                count(*) FILTER (WHERE VALUE > 160 AND VALUE <= 180) || ',' ||
                count(*) FILTER (WHERE VALUE > 180 AND VALUE <= 200) || ',' ||
                count(*) FILTER (WHERE VALUE > 200 AND VALUE <= 220) || ',' ||
                count(*) FILTER (WHERE VALUE > 220 AND VALUE <= 240) || ',' ||
                count(*) FILTER (WHERE VALUE > 240 AND VALUE <= 260) || ',' ||
                count(*) FILTER (WHERE VALUE > 260 AND VALUE <= 280) || ',' ||
                count(*) FILTER (WHERE VALUE > 280 AND VALUE <= 300) || ',' ||
                count(*) FILTER (WHERE VALUE > 300 AND VALUE <= 320) || ',' ||
                count(*) FILTER (WHERE VALUE > 320 AND VALUE <= 340) || ',' ||
                count(*) FILTER (WHERE VALUE > 340 AND VALUE <= 360), ',')::int[] AS data
            FROM (
                     SELECT g.parent_id,
                            s.name AS site_name,
                            d.value::double precision
                     FROM thanados.tbl_sites s
                              JOIN thanados.graves g ON g.parent_id = s.id
                              JOIN thanados.burials b ON b.parent_id = g.child_id
                              JOIN thanados.dimensiontypes d ON b.child_id = d.entity_id
                     WHERE d.name = 'Degrees' AND g.parent_id = %(place_id)s
                 ) v
            GROUP BY parent_id, site_name;
            """

            g.cursor.execute(sql_deg, {'place_id': place_id})
            result = g.cursor.fetchone()

            if result:
                _data = {"labels": result.labels,
                         "datasets": result.data}
                return _data
            else:
                _data = {"labels": [],
                         "datasets": []}
                return _data

        def getAzimuth():
            sql_azimuth = """

            SELECT 
                parent_id                                  AS "site_id",
                site_name                                  AS "label",
                string_to_array('0-20, 20-40, 40-60, 60-80, 80-100, 100-120, 120-140, 140-160, 160-180', ',') AS labels,
                string_to_array(count(*) FILTER (WHERE VALUE <= 20) || ',' ||
                count(*) FILTER (WHERE VALUE > 20 AND VALUE <= 40) || ',' ||
                count(*) FILTER (WHERE VALUE > 40 AND VALUE <= 60) || ',' ||
                count(*) FILTER (WHERE VALUE > 60 AND VALUE <= 80) || ',' ||
                count(*) FILTER (WHERE VALUE > 80 AND VALUE <= 100) || ',' ||
                count(*) FILTER (WHERE VALUE > 100 AND VALUE <= 120) || ',' ||
                count(*) FILTER (WHERE VALUE > 120 AND VALUE <= 140) || ',' ||
                count(*) FILTER (WHERE VALUE > 140 AND VALUE <= 160) || ',' ||
                count(*) FILTER (WHERE VALUE > 160 AND VALUE <= 180), ',')::int[] AS data   
            FROM (
                     SELECT g.parent_id,
                            s.name AS site_name,
                            d.value::double precision
                     FROM thanados.tbl_sites s
                              JOIN thanados.graves g ON g.parent_id = s.id
                              JOIN thanados.dimensiontypes d ON g.child_id = d.entity_id
                     WHERE d.name = 'Azimuth' AND g.parent_id = %(place_id)s
                 ) v
            GROUP BY parent_id, site_name;
            """

            g.cursor.execute(sql_azimuth, {'place_id': place_id})
            result = g.cursor.fetchone()

            if result:
                _data = {"labels": result.labels,
                         "datasets": result.data}
                return _data
            else:
                return {"labels": [],
                        "datasets": []}

        def getAges():
            sql_age = """
                SELECT ages FROM thanados.dashage WHERE site_id = %(iwas)s                                                
            """
            g.cursor.execute(sql_age, {'iwas': place_id})
            result = g.cursor.fetchone()

            if result:
                _data = result.ages
                return _data
            else:
                return []

        def getValueAges():
            minAges = (118152, 118134, 117199)
            maxAges = (118151, 118132, 117200)

            sqlValueAges = """
            DROP TABLE IF EXISTS thanados.valueAges;
            CREATE TABLE thanados.valueAges AS
            SELECT child_name, burial_id, count(burial_id), min, NULL::INT AS max 
                FROM thanados.searchdata 
                WHERE type_id IN (118152, 118134, 117199) 
                AND site_id = %(place_id)s GROUP BY child_name, burial_id, min ORDER BY count DESC;

            UPDATE thanados.valueAges v SET max = d.max FROM 
            (SELECT child_name, burial_id, count(burial_id), min as max 
            FROM thanados.searchdata WHERE type_id IN (118151, 118132, 117200)
            AND site_id = %(place_id)s GROUP BY child_name, burial_id, min) d WHERE v.burial_id = d.burial_id;

            DELETE FROM thanados.valueAges WHERE min ISNULL OR max ISNULL;

            SELECT jsonb_agg(jsonb_build_object(
                'name', v.name,
                'from', v.from,
                'to', v.to
                )) AS ages FROM (SELECT child_name AS name, min AS from, max AS to FROM thanados.valueAges) v;
            """

            g.cursor.execute(sqlValueAges, {'place_id': place_id})
            result = g.cursor.fetchone();

            if result.ages:
                _data = result.ages
                return _data
            else:
                return []

        def getSex():
            sql_sex = """
                    DROP TABLE IF EXISTS thanados.sexDash;
                    CREATE TABLE thanados.sexDash AS (
                    
                    SELECT burial_id, type, type_id
                    FROM thanados.searchdata WHERE type_id IN (25, 22374, 24, 22373, 118129, 22375) AND site_id = %(place_id)s);
                    
                    INSERT INTO thanados.sexDash (
                    SELECT burial_id, 'subadult', '0'
                    FROM thanados.searchdata WHERE
                                                    type_id NOT IN (22283, 22284, 117201, 22285, 22286, 22287, 22288)
                                                    AND path LIKE 'Anthropology > Age%%'
                                                    AND site_id = %(place_id)s
                                                    AND burial_id NOT IN (SELECT burial_id FROM thanados.sexDash));
                    
                    INSERT INTO thanados.sexDash (
                    SELECT burial_id, 'subadult', '0'
                    FROM thanados.searchdata WHERE
                                                    type_id NOT IN (118152, 118134, 117199)
                                                    AND path LIKE 'Absolute Age%%'
                                                    AND type_id NOT IN (118152, 118134, 117199)
                                                    AND min < 18
                                                    AND site_id = %(place_id)s
                                                    AND burial_id NOT IN (SELECT burial_id FROM thanados.sexDash));
                    
                    SELECT jsonb_agg(jsonb_build_object(
                                   'name', b.type,
                                   'count', b.count)) AS sex FROM (SELECT type, count(type) FROM
                                        (SELECT type
                                        FROM thanados.sexDash) a GROUP BY type ORDER BY type ASC   ) b
                    """

            g.cursor.execute(sql_sex, {'place_id': place_id})
            result = g.cursor.fetchone()

            if result.sex:
                _data = result.sex
                return _data
            else:
                return []

        def getgender():
            sql_gender = """
                    SELECT jsonb_agg(jsonb_build_object(
                        'name', b.type,
                        'count', b.count
                      )) AS gender FROM (SELECT type, count(type) FROM
                            (SELECT burial_id, type, type_id
                            FROM thanados.searchdata WHERE type_id IN (120168, 120167) 
                            AND site_id = %(place_id)s) a GROUP BY type ORDER BY type DESC) b
                    """

            g.cursor.execute(sql_gender, {'place_id': place_id})
            result = g.cursor.fetchone()

            if result.gender:
                _data = result.gender
                return _data
            else:
                return []

        def getSexDepth():
            sqlSexDepth = """
                                DROP TABLE IF EXISTS thanados.sexDash;
                    CREATE TABLE thanados.sexDash AS (
                        SELECT burial_id, type, type_id
                        FROM thanados.searchdata
                        WHERE type_id IN (25, 22374, 24, 22373)
                          AND site_id = %(place_id)s);
                    
                    INSERT INTO thanados.sexDash (
                        SELECT burial_id, type, searchdata.type_id
                        FROM thanados.searchdata
                        WHERE type_id IN (120168, 120167)
                          AND site_id = %(place_id)s
                          AND burial_id NOT IN (SELECT burial_id FROM thanados.sexDash));
                    
                    INSERT INTO thanados.sexDash (
                        SELECT burial_id, 'Subadult', '0'
                        FROM thanados.searchdata
                        WHERE type_id NOT IN (22283, 22284, 117201, 22285, 22286, 22287, 22288)
                          AND path LIKE 'Anthropology > Age%%'
                          AND site_id = %(place_id)s
                          AND burial_id NOT IN (SELECT burial_id FROM thanados.sexDash));
                    
                    INSERT INTO thanados.sexDash (
                        SELECT burial_id, 'Subadult', '0'
                        FROM thanados.searchdata
                        WHERE type_id NOT IN (118152, 118134, 117199)
                          AND path LIKE 'Absolute Age%%'
                          AND type_id NOT IN (118152, 118134, 117199)
                          AND min < 18
                          AND site_id = %(place_id)s
                          AND burial_id NOT IN (SELECT burial_id FROM thanados.sexDash));
                    
                    UPDATE thanados.sexDash SET type = REPLACE (
                         type,
                       '?',
                       ''
                       );
                    
                    DROP TABLE IF EXISTS thanados.sexGraveDepth;
                    CREATE TABLE thanados.sexGraveDepth AS
                    
                    (SELECT s.type, g.min FROM thanados.sexDash s JOIN thanados.burials b ON s.burial_id = b.child_id JOIN thanados.searchdata g ON g.child_id = b.parent_id
                    WHERE g.type = 'Height' AND g.system_type = 'feature');
                    
                    DROP TABLE IF EXISTS thanados.sexGraveDepthJSON;
                    CREATE TABLE thanados.sexGraveDepthJSON AS
                    SELECT
                                    type,
                                    string_to_array('0-20, 20-40, 40-60, 60-80, 80-100, 100-120, 120-140, 140-160, 160-180, 180-200, 200-220, 220-240, 240-260, 260-280, 280-300, 300-320, 320-340, 340-360, 360-380, 380-400, 400-420, 420-440, 440-460, 460-480, 480-500, 500-520, 520-540, 540-560, 560-580, 580-600, over 600', ',') AS labels,
                                    string_to_array(count(type) FILTER (WHERE min <= 20 ) || ',' ||
                                    count(type) FILTER (WHERE min > 20 AND min <= 40 ) || ',' ||
                                    count(type) FILTER (WHERE min > 40 AND min <= 60 ) || ',' ||
                                    count(type) FILTER (WHERE min > 60 AND min <= 80 ) || ',' ||
                                    count(type) FILTER (WHERE min > 80 AND min <= 100 ) || ',' ||
                                    count(type) FILTER (WHERE min > 100 AND min <= 120 ) || ',' ||
                                    count(type) FILTER (WHERE min > 120 AND min <= 140 ) || ',' ||
                                    count(type) FILTER (WHERE min > 140 AND min <= 160 ) || ',' ||
                                    count(type) FILTER (WHERE min > 160 AND min <= 180 ) || ',' ||
                                    count(type) FILTER (WHERE min > 180 AND min <= 200 ) || ',' ||
                                    count(type) FILTER (WHERE min > 200 AND min <= 220 ) || ',' ||
                                    count(type) FILTER (WHERE min > 220 AND min <= 240 ) || ',' ||
                                    count(type) FILTER (WHERE min > 240 AND min <= 260 ) || ',' ||
                                    count(type) FILTER (WHERE min > 260 AND min <= 280 ) || ',' ||
                                    count(type) FILTER (WHERE min > 280 AND min <= 300 ) || ',' ||
                                    count(type) FILTER (WHERE min > 300 AND min <= 320 ) || ',' ||
                                    count(type) FILTER (WHERE min > 320 AND min <= 340 ) || ',' ||
                                    count(type) FILTER (WHERE min > 340 AND min <= 360 ) || ',' ||
                                    count(type) FILTER (WHERE min > 360 AND min <= 380 ) || ',' ||
                                    count(type) FILTER (WHERE min > 380 AND min <= 400 ) || ',' ||
                                    count(type) FILTER (WHERE min > 300 AND min <= 420 ) || ',' ||
                                    count(type) FILTER (WHERE min > 420 AND min <= 440 ) || ',' ||
                                    count(type) FILTER (WHERE min > 440 AND min <= 460 ) || ',' ||
                                    count(type) FILTER (WHERE min > 460 AND min <= 480 ) || ',' ||
                                    count(type) FILTER (WHERE min > 480 AND min <= 500 ) || ',' ||
                                    count(type) FILTER (WHERE min > 500 AND min <= 520 ) || ',' ||
                                    count(type) FILTER (WHERE min > 520 AND min <= 540 ) || ',' ||
                                    count(type) FILTER (WHERE min > 540 AND min <= 560 ) || ',' ||
                                    count(type) FILTER (WHERE min > 560 AND min <= 580 ) || ',' ||
                                    count(type) FILTER (WHERE min > 580 AND min <= 600 ) || ',' ||
                                    count(type) FILTER (WHERE min > 600) , ',')::int[] AS data
                    
                                    FROM thanados.sexGraveDepth v GROUP BY type;
                    
                    SELECT * FROM thanados.sexGraveDepthJSON;
            """
            g.cursor.execute(sqlSexDepth, {'place_id': place_id})
            result = g.cursor.fetchall()
            _data = {}
            _data['datasets'] = []
            for row in result:
                _data['labels'] = row.labels
                _data['datasets'].append({'label': row.type, 'data': row.data})

            return (_data)




        SexDepthData = getSexDepth()
        SexData = getSex()
        GenderData = getgender()
        ValueAgeData = getValueAges()
        DashAgeData = getAges()
        constrData = Data.get_type_data('grave', 'Grave Constr%', tuple(ast.literal_eval('[' + str(place_id) + ']')))[0]
        aziData = getAzimuth()
        degData = getDegs()
        depthData = getDims('Height')
        widthData = getDims('Width')
        lengthData = getDims('Length')

        network = Data.getNetwork(place_id)
        wordcloud = Data.get_wordcloud(place_id)
        return render_template('entity/dashboard.html', network=network, entity=entity, wordcloud=wordcloud,
                               mysitejson=data, findBubble=findtree, depthData=depthData, widthData=widthData,
                               lengthData=lengthData, degData=degData, aziData=aziData, constrData=constrData,
                               DashAgeData=DashAgeData, ValueAgeData=ValueAgeData, SexData=SexData, GenderData=GenderData, SexDepthData=SexDepthData)

    return render_template('entity/view.html', place_id=place_id, object_id=object_id,
                           mysitejson=data, system_type=system_type)
