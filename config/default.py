import os
DEBUG = False

DATABASE_NAME = 'openatlas'
DATABASE_USER = 'openatlas'
DATABASE_HOST = 'localhost'
DATABASE_PORT = 5432
DATABASE_PASS = 'CHANGE ME'
SECRET_KEY = 'CHANGE ME'
SITE_LIST = 0
WEB_FOLDER_PATH = '/static/images/entities'
UPLOAD_FOLDER_PATH = os.path.dirname(__file__) + '/../thanados' + WEB_FOLDER_PATH
THUNDERFOREST_API_KEY = 'yourAPIKey'
OPENATLAS_URL = 'https://url_to_database_backend + /entity/'
