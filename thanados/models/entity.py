import glob
import os

from flask import g

from thanados import app


class Data:

    @staticmethod
    def get_list():
        sql_sites = """
        DROP TABLE IF EXISTS thanados.tmpsites;
            CREATE TABLE thanados.tmpsites AS (
                
                     SELECT s.child_name     AS name,
                            s.description    AS description,
                            s.begin_from     AS begin,
                            s.end_to         AS end,
                            s.child_id       AS id,
                            s.typename       AS type,
                            s.path,
                            s.lat,
                            s.lon,
                            COUNT(s.child_id)::TEXT AS graves

                     FROM thanados.entities s LEFT JOIN thanados.graves g ON s.child_id = g.parent_id
                     WHERE s.system_type = 'place' AND s.lat IS NOT NULL AND s.child_id IN  %(sites)s 
                     GROUP BY s.child_name, s.description, s.begin_from, s.end_to, s.child_id, s.typename, s.path, s.lat, s.lon
                     ORDER BY s.child_name);"""

        sql_sites2 = """
        UPDATE thanados.tmpsites SET (graves) = (SELECT graves FROM ( 
            SELECT              
                    s.name,
                    s.description,
                    s.begin,
                    s.end,
                    s.id,
                    s.type,
                    s.path,
                    s.lat,
                    s.lon,
                    COUNT(mt.path) FILTER (WHERE mt.path LIKE '%> Grave%')::TEXT AS graves                           

                     FROM thanados.tmpsites s LEFT JOIN thanados.graves g ON s.id = g.parent_id LEFT JOIN thanados.maintype mt ON g.child_id = mt.entity_id 
                     GROUP BY s.name, s.description, s.begin, s.end, s.id, s.type, s.path, s.lat, s.lon) a WHERE id = thanados.tmpsites.id);
                     UPDATE thanados.tmpsites SET graves = NULL WHERE graves = '0';     
                     
            SELECT jsonb_agg(a) as sitelist FROM thanados.tmpsites a;"""
        g.cursor.execute(sql_sites, {"sites": tuple(g.site_list)})
        g.cursor.execute(sql_sites2)
        return g.cursor.fetchall()

    @staticmethod
    def get_file_path(id_: int):
        path = glob.glob(os.path.join(app.config['UPLOAD_FOLDER_PATH'], str(id_) + '.*'))
        if path:
            filename, file_extension = os.path.splitext(path[0])
            return app.config['WEB_FOLDER_PATH'] + '/' + str(id_) + file_extension
        return ''

    @staticmethod
    def get_data(place_id):
        sql = 'SELECT data FROM thanados.tbl_thanados_data WHERE id = %(place_id)s AND id IN %(sites)s;'
        g.cursor.execute(sql, {'place_id': place_id, 'sites': tuple(g.site_list)})
        return g.cursor.fetchall()

    @staticmethod
    def get_typedata(object_id):
        sql = 'SELECT * FROM model.entity WHERE id = %(object_id)s;'
        g.cursor.execute(sql, {'object_id': object_id})
        return g.cursor.fetchall()

    @staticmethod
    def get_depth():
        g.cursor.execute('SELECT depth FROM thanados.chart_data;')
        return g.cursor.fetchall()

    @staticmethod
    def get_orientation():
        sql = 'SELECT orientation FROM thanados.chart_data;'
        g.cursor.execute(sql)
        return g.cursor.fetchall()

    @staticmethod
    def get_azimuth():
        sql = 'SELECT azimuth FROM thanados.chart_data;'
        g.cursor.execute(sql)
        return g.cursor.fetchall()

    @staticmethod
    def get_sex():
        sql = 'SELECT sex FROM thanados.chart_data;'
        g.cursor.execute(sql)
        return g.cursor.fetchall()

    @staticmethod
    def get_system_type(id_):
        sql = "SELECT system_type FROM model.entity WHERE id = %(object_id)s;"
        g.cursor.execute(sql, {"object_id": id_})
        return g.cursor.fetchone()[0]

    @staticmethod
    def get_parent_place_id(id_):
        system_type = Data.get_system_type(id_)
        if system_type == 'place':
            place_id = id_
        elif system_type == 'feature':
            sql = """
                 SELECT p.id
                 FROM model.entity p
                 JOIN model.link lf on p.id = lf.domain_id AND lf.property_code = 'P46'
                 WHERE lf.range_id = %(object_id)s;"""
            g.cursor.execute(sql, {"object_id": id_})
            place_id = g.cursor.fetchone()[0]
        elif system_type == 'stratigraphic unit':
            sql = """
                  SELECT p.id
                  FROM model.entity p
                  JOIN model.link lf on p.id = lf.domain_id AND lf.property_code = 'P46'
                  JOIN model.link ls on lf.range_id = ls.domain_id AND ls.property_code = 'P46'
                  WHERE ls.range_id = %(object_id)s;"""
            g.cursor.execute(sql, {"object_id": id_})
            place_id = g.cursor.fetchone()[0]
        elif system_type == 'human remains':
            sql = """
                  SELECT p.id
                  FROM model.entity p
                  JOIN model.link lf on p.id = lf.domain_id AND lf.property_code = 'P46'
                  JOIN model.link ls on lf.range_id = ls.domain_id AND ls.property_code = 'P46'
                  JOIN model.link lfi on ls.range_id = lfi.domain_id AND lfi.property_code = 'P46'
                  WHERE lfi.range_id = %(object_id)s;"""
            g.cursor.execute(sql, {"object_id": id_})
            place_id = g.cursor.fetchone()[0]
        else:  # has to be a find
            sql = """
                  SELECT p.id
                  FROM model.entity p
                  JOIN model.link lf on p.id = lf.domain_id AND lf.property_code = 'P46'
                  JOIN model.link ls on lf.range_id = ls.domain_id AND ls.property_code = 'P46'
                  JOIN model.link lfi on ls.range_id = lfi.domain_id AND lfi.property_code = 'P46'
                  WHERE lfi.range_id = %(object_id)s;"""
            g.cursor.execute(sql, {"object_id": id_})
            place_id = g.cursor.fetchone()[0]
        return place_id

    @staticmethod
    def get_type_data(level, searchterm):
        if level == 'grave':
            sql = """
                SELECT jsonb_agg(jsonb_build_object (
	            'site_id', t.id,
	            'site', t.sitename,
	            'type', t.type,
	            'count', t.count
	            )) as types FROM
		        (SELECT 
		        m.id,
		        m.name AS sitename,
		        t.name AS type,
		        count(t.name) 
		        FROM model.entity m 
		        JOIN thanados.entities e ON e.parent_id = m.id 
		        JOIN thanados.types_main t ON e.child_id = t.entity_id
		        WHERE t.path LIKE %(term)s
		        GROUP BY m.id, sitename, type
		        ORDER BY 1) as t;"""
            g.cursor.execute(sql, {"term": searchterm})
            return g.cursor.fetchall()
        if level == 'burial':
            sql = """
                            SELECT jsonb_agg(jsonb_build_object (
            	            'site_id', t.id,
            	            'site', t.sitename,
            	            'type', t.type,
            	            'count', t.count
            	            )) as types FROM
            		        (SELECT 
            		        m.id,
            		        m.name AS sitename,
            		        t.name AS type,
            		        count(t.name) 
            		        FROM model.entity m 
            		        JOIN thanados.entities e ON e.parent_id = m.id
            		        JOIN thanados.entities e1 ON e1.parent_id = e.child_id
            		        JOIN thanados.types_main t ON e1.child_id = t.entity_id
            		        WHERE t.path LIKE %(term)s
            		        GROUP BY m.id, sitename, type
            		        ORDER BY 1) as t;"""
            g.cursor.execute(sql, {"term": searchterm})
            return g.cursor.fetchall()

    @staticmethod
    def getNetwork(id):
        edges = []
        nodes = []
        entities = []
        types = []
        sql = """
                        WITH RECURSIVE subunits AS (
            	SELECT
            		domain_id,
            		range_id,
            		property_code
            	FROM
            		model.link
            	WHERE
            		domain_id = %(id)s
            	UNION
            		SELECT
            		l.domain_id,
            		l.range_id,
            		l.property_code
            	FROM
            		model.link l INNER JOIN subunits s ON s.range_id = l.domain_id WHERE l.property_code = 'P46'
            ) SELECT
            	*
            FROM
            	subunits
            	
            UNION ALL 
            SELECT * FROM (
            WITH RECURSIVE superunits AS (
            	SELECT
            		domain_id,
            		range_id,
            		property_code
            	FROM
            		model.link
            	WHERE
            		range_id = %(id)s
            	UNION
            		SELECT
            		l.domain_id,
            		l.range_id,
            		l.property_code
            	FROM
            		model.link l INNER JOIN superunits s ON s.domain_id = l.range_id WHERE l.property_code = 'P46'
            ) SELECT
            	*
            FROM
            	superunits) su
        """




        g.cursor.execute(sql, {"id": id})
        result = g.cursor.fetchall()

        for row in result:
            if row.property_code == 'P2':
                types.append(row.range_id)
            edges.append({'from': row.domain_id, 'to': row.range_id})
            entities.append(row.domain_id)
            entities.append(row.range_id)


        entities=list(dict.fromkeys(entities))
        entities = tuple(entities)

        sqltypes = """
                WITH RECURSIVE supertypes AS (
                    	SELECT
                    		id,
                    		parent_id
                    	FROM
                    		thanados.types_all
                    	WHERE
                    		id IN %(id)s
                    	UNION
                    		SELECT
                    		l.id,
                    		l.parent_id
                    	FROM
                    		thanados.types_all l INNER JOIN supertypes s ON s.parent_id = l.id
                    ) SELECT
                    	*
                    FROM
                    	supertypes;
                """

        g.cursor.execute(sqltypes, {"id": tuple(types)})
        resulttypes = g.cursor.fetchall()

        for row in resulttypes:
            if row.parent_id:
                edges.append({'from': row.id, 'to': row.parent_id})
                types.append(row.id)
                types.append(row.parent_id)

        sql2 = """
                    SELECT id, name, system_type FROM model.entity WHERE id IN %(entities)s OR id IN %(types)s
                        """
        g.cursor.execute(sql2, {"entities": entities, "types": tuple(types)})
        result2 = g.cursor.fetchall()

        for row in result2:
            if row.id != id:
                if row.system_type:
                    group = row.system_type
                else:
                    group = 'classification'
                nodes.append({'label': row.name, 'id': row.id, 'group': group, 'title': group})
            else:
                nodes.append({'label': row.name, 'id': row.id, 'group': row.system_type, 'title': row.system_type, 'size': 30})

        network = {}
        network['nodes'] = nodes
        network['edges'] = edges

        return network
