from flask import render_template, g

from medcem import app
from medcem.models.entity import Data


@app.route('/charts')
def charts():
    depth = Data.get_depth()
    sex = Data.get_sex()
    orientation = Data.get_orientation()
    sql_thunau = """
                SELECT age FROM jsonprepare.ageatdeath WHERE sitename = 'Gars Thunau Obere Holzwiese';
                """
    g.cursor.execute(sql_thunau)
    thunau = g.cursor.fetchall()
    sql_kourim = """
                    SELECT age FROM jsonprepare.ageatdeath WHERE sitename = 'Stará Kouřim';
                    """
    g.cursor.execute(sql_kourim)
    kourim = g.cursor.fetchall()
    sql_pohansko = """
                        SELECT age FROM jsonprepare.ageatdeath WHERE sitename = 'Břeslav Pohansko Herrenhof';
                        """
    g.cursor.execute(sql_pohansko)
    pohansko = g.cursor.fetchall()


    return render_template('charts/charts.html', depth_data=depth[0].depth, thunau_age=thunau[0], kourim_age=kourim[0], pohansko_age=pohansko[0],
                           orientation_data=orientation[0].orientation, sex_data=sex[0].sex)
