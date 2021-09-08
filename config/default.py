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
JPG_FOLDER_PATH = '/static/images/entities/jpgs'
UPLOAD_FOLDER_PATH = os.path.dirname(__file__) + '/../thanados' + WEB_FOLDER_PATH

THUNDERFOREST_API_KEY = 'yourAPIKey'
OPENATLAS_URL = 'https://thanados.openatlas.eu/update/'

USE_API = False
USE_JPGS = False

API_URL = 'https://thanados.openatlas.eu/api/0.2/entity/'
API_FILE_DISPLAY = 'https://thanados.openatlas.eu/api/display/'

HIERARCHY_TYPES = 73, 13362, 13365, 157754, 119334
SYSTEM_TYPES = 12935, 116219, 2
CUSTOM_TYPES = 119049, 119444, 119472, 119497, 128046, 22276, 22308, 22320, 23, 23440, 25158, 5097, 5118, 8240, 141697, 145463, 140737
VALUE_TYPES = 117198, 118155, 118181, 128783, 15678, 21160, 131985
