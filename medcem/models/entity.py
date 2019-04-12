from flask import g


class Data:

    @staticmethod
    def get_data(place_id):
        sql = 'SELECT data FROM jsonprepare.tbl_medcem_data WHERE id = %(place_id)s;'
        g.cursor.execute(sql, {'place_id': place_id})
        return g.cursor.fetchall()
