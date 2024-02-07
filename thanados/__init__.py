import json

import psycopg2.extras
from flask import Flask, g, request
from flask_wtf.csrf import CSRFProtect
from flask_login import current_user

app = Flask(__name__, instance_relative_config=True)
csrf = CSRFProtect(app)  # Make sure all forms are CSRF protected
csrf.init_app(app)

app.config.from_object('config.default')  # Load config/INSTANCE_NAME.py
app.config.from_pyfile('devill.py')  # Load instance/INSTANCE_NAME.py

thunderforest_API_key = app.config["THUNDERFOREST_API_KEY"]
openatlas_url = app.config["OPENATLAS_URL"]
domaintypes = app.config["DOMAIN_TYPES"]
periodtypes = app.config["PERIOD_TYPES"]
countrytypes = app.config["COUNTRY_TYPES"]
api_url = app.config["API_URL"]
loc_image = app.config["API_FILE_DISPLAY"]
web_folder = app.config["WEB_FOLDER_PATH"] + '/'
web_folder = app.config["API_FILE_DISPLAY"]
use_api = app.config["USE_API"]
use_iiif = app.config["USE_IIIF"]
use_jpgs = app.config["USE_JPGS"]
geonames_user = app.config["GEONAMES_USERNAME"]
leafletVersion = ""

if use_iiif:
    image_suffix = "/full/max/0/default.jpg"
else:
    image_suffix = ""

if not use_api:
    if use_jpgs:
        loc_image = app.config["JPG_FOLDER_PATH"] + '/'
    else:
        loc_image = app.config["WEB_FOLDER_PATH"] + '/'

if use_iiif:
    loc_image = app.config["IIIF_URL"]

from thanados.views import (
    index, map, about, entity, charts, login, manual, sites, admin, search,
    ajax, vocabulary, error)


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
    g.db = connect()
    g.cursor = g.db.cursor(cursor_factory=psycopg2.extras.NamedTupleCursor)

    # Get site ids of site to be shown, default or if error show all
    g.site_list = []
    if current_user.is_authenticated:
        g.cursor.execute('SELECT child_id FROM devill.sites;')
        g.site_list = [row.child_id for row in g.cursor.fetchall()]
    else:
        try:
            with open(app.root_path + "/../instance/site_list.txt") as file:
                g.site_list = json.loads(file.read())
        except Exception as e:  # pragma: no cover
            pass
        if not g.site_list:
            g.cursor.execute('SELECT child_id FROM devill.sites;')
            g.site_list = [row.child_id for row in g.cursor.fetchall()]

@app.teardown_request
def teardown_request(exception):
    g.db.close()


@app.context_processor
def global_vars():
    return dict(
        thunderforest=thunderforest_API_key,
        openAtlasUrl=openatlas_url,
        api_url=api_url,
        image_suffix=image_suffix,
        loc_image=loc_image,
        web_folder=web_folder,
        use_api=use_api,
        domaintypes=domaintypes,
        periodtypes=periodtypes,
        geonames_user=geonames_user,
        countrytypes=countrytypes,
        leafletVersion=leafletVersion)
