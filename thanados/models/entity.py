from flask import g


class Data:

    @staticmethod
    def get_data(place_id):
        sql = 'SELECT data FROM thanados.tbl_thanados_data WHERE id = %(place_id)s;'
        g.cursor.execute(sql, {'place_id': place_id})
        return g.cursor.fetchall()

    @staticmethod
    def get_depth():
        sql = 'SELECT depth FROM thanados.chart_data;'
        g.cursor.execute(sql)
        return g.cursor.fetchall()

    @staticmethod
    def get_orientation():
        sql = 'SELECT orientation FROM thanados.chart_data;'
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
    def get_typedata(level, searchterm):
        if level == 'grave':
            sql = """
                SELECT jsonb_agg(jsonb_build_object (
	            'id', t.id,
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
            	            'id', t.id,
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

