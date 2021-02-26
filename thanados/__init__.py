import json

import psycopg2.extras
from flask import Flask, g, request
from flask_wtf.csrf import CSRFProtect

app = Flask(__name__, instance_relative_config=True)
csrf = CSRFProtect(app)  # Make sure all forms are CSRF protected
csrf.init_app(app)

app.config.from_object('config.default')  # Load config/INSTANCE_NAME.py
app.config.from_pyfile('production.py')  # Load instance/INSTANCE_NAME.py

thunderforest_API_key = app.config["THUNDERFOREST_API_KEY"]
openatlas_url = app.config["OPENATLAS_URL"]
api_url = app.config["API_URL"]

from thanados.views import index, map, about, entity, charts, login, manual, sites, admin, \
    search, ajax, vocabulary


def connect():
    try:
        connection_ = psycopg2.connect(
            database=app.config['DATABASE_NAME'],
            user=app.config['DATABASE_USER'],
            password=app.config['DATABASE_PASS'],
            port=app.config['DATABASE_PORT'],
            host=app.config['DATABASE_HOST'])
        connection_.autocommit = True
        return connection_
    except Exception as e:  # pragma: no cover
        print("Database connection error.")
        raise Exception(e)


@app.before_request
def before_request():
    if request.path.startswith('/static'):  # pragma: no cover
        return  # Only needed if not running with apache and static alias
    g.db = connect()
    g.cursor = g.db.cursor(cursor_factory=psycopg2.extras.NamedTupleCursor)

    # Get site ids of site to be shown, default or if error show all
    site_list = []
    try:
        with open("./instance/site_list.txt") as file:
            site_list = json.loads(file.read())
    except Exception as e:  # pragma: no cover
        pass
    if not site_list:
        g.cursor.execute('SELECT child_id FROM thanados.sites;')
        result = g.cursor.fetchall()
        site_list = [row.child_id for row in result]
    g.site_list = site_list


@app.teardown_request
def teardown_request(exception):
    if hasattr(g, 'db'):
        g.db.close()


@app.context_processor
def global_vars():
    return dict(thunderforest=thunderforest_API_key, openAtlasUrl=openatlas_url, api_url=api_url)

if __name__ == "__main__":  # pragma: no cover
    app.run()
