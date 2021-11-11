import os

import requests
from flask import g

from thanados import app


def api_download():
    not_found = 0
    file_done = 0
    file_name = ''
    failed = []
    message = ''
    print('Downloading images/files')
    sql_files = """
        SELECT id 
        FROM model.entity 
        WHERE openatlas_class_name = 'file' 
            AND id IN (
                SELECT domain_id FROM model.link 
                WHERE range_id IN 
                (SELECT id FROM thanados.types_all WHERE topparent = '12935')
                AND property_code = 'P2')"""
    g.cursor.execute(sql_files)
    licensed_file_entities = g.cursor.fetchall()

    for row in licensed_file_entities:
        found = False
        for extension in app.config['MEDIA_EXTENSION']:
            file_name = f'{row.id}{extension}'
            path = f'thanados{app.config["WEB_FOLDER_PATH"]}/{file_name}'
            if os.path.isfile(path):
                message = f'{file_name} already exists'
                found = True
                break

        if not found:
            print(row.id)
            for extension in app.config['MEDIA_EXTENSION']:
                file_name = f'{row.id}{extension}'
                try:
                    r = requests.get(app.config["API_FILE_DISPLAY"] + file_name)
                    print(f'trying {extension}: {r.status_code}')
                    if r.status_code == 200:
                        path = \
                            f'thanados{app.config["WEB_FOLDER_PATH"]}/' \
                            f'{file_name}'
                        with open(path, 'wb') as f:
                            f.write(r.content)
                        message = f'downloaded: {file_name}'
                        found = True
                        break
                    elif r.status_code == 403:
                        not_found += 1
                        break
                    elif r.status_code == 404:
                        message = f'{row.id} not found'
                except Exception:
                    message = f'{file_name} Error'
                    not_found += 1
                    failed.append(message)
            if not found:
                not_found += 1

        file_done += 1
        percent = int(file_done / len(licensed_file_entities) * 100)
        print(
            f'{percent}% - File: {file_name} - '
            f'{file_done} of {len(licensed_file_entities)}: {message}')

    print(
        f'{len(licensed_file_entities) - not_found} of '
        f'{len(licensed_file_entities)} successfully done')
    print('Failed files:')
    print(failed)
