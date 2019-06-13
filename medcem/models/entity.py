from flask import g


class Data:

    @staticmethod
    def get_data(place_id):
        sql = 'SELECT data FROM jsonprepare.tbl_medcem_data WHERE id = %(place_id)s;'
        g.cursor.execute(sql, {'place_id': place_id})
        return g.cursor.fetchall()

    @staticmethod
    def get_depth():
        sql = 'SELECT depth FROM jsonprepare.chart_data;'
        g.cursor.execute(sql)
        return g.cursor.fetchall()

    @staticmethod
    def get_orientation():
        sql = 'SELECT orientation FROM jsonprepare.chart_data;'
        g.cursor.execute(sql)
        return g.cursor.fetchall()

    @staticmethod
    def get_sex():
        sql = 'SELECT sex FROM jsonprepare.chart_data;'
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
