import os
DEBUG = False

# Database
DATABASE_NAME = 'openatlas'
DATABASE_USER = 'openatlas'
DATABASE_HOST = 'localhost'
DATABASE_PORT = 5432
DATABASE_PASS = 'CHANGE ME'

SECRET_KEY = 'CHANGE ME'

# Used in file operations, order is important
MEDIA_EXTENSION = ['.png', '.bmp', '.jpg', '.jpeg', '.glb']

# Path
WEB_FOLDER_PATH = '/static/images/entities'
JPG_FOLDER_PATH = '/static/images/jpgs'
UPLOAD_FOLDER_PATH = os.path.dirname(__file__) + '/../thanados' + WEB_FOLDER_PATH
UPLOAD_JPG_FOLDER_PATH = os.path.dirname(__file__) + '/../thanados' + JPG_FOLDER_PATH

THUNDERFOREST_API_KEY = 'yourAPIKey'
OPENATLAS_URL = 'https://thanados.openatlas.eu/update/'

USE_API = False
USE_JPGS = False
USE_IIIF = False

API_URL = 'https://thanados.openatlas.eu/api/'
API_FILE_DISPLAY = 'https://thanados.openatlas.eu/api/display/'

GEONAMES_USERNAME = 'yourgeonamesusername'

HIERARCHY_TYPES = 73, 13362, 13365, 157754, 119334
DOMAIN_TYPES = 128051, 158220, 181731, 181740, 199939
PERIOD_TYPES = 158070, 161611, 127472, 161610, 161603, 142302, 155395
VALUE_TYPES = 117198, 118155, 118181, 128783, 15678, 21160, 131985
COUNTRY_TYPES = 184895, 184896

META_RESOLVE_URL = 'https://thanados.net'
META_PUBLISHER = 'THANADOS'
META_ORGANISATION = 'Natural History Museum Vienna'
META_ORG_URL = 'https://nhm-wien.ac.at'
META_ORG_WD = 'https://www.wikidata.org/wiki/Q688704'
META_LICENSE = 'https://creativecommons.org/licenses/by/4.0/'

IIIF_BASE = 'https://iiif.bitem.at/iiif/'
IIIF_VERSION = '3'
IIIF_URL = IIIF_BASE + IIIF_VERSION + '/'
FILETYPE_API = '/licensed_file_overview/'
