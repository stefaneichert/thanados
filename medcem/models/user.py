# Created by Alexander Watzinger and others. Please see README.md for licensing information

from flask import g
from flask_login import UserMixin


class User(UserMixin):
    def __init__(self, row=None):
        self.id = None
        self.username = None
        if not row:
            return
        self.id = row.id
        self.active = True if row.active == 1 else False
        self.username = row.username
        self.password = row.password


class UserMapper:
    sql = """
        SELECT u.id, u.username, u.password, u.active, u.real_name, u.info, u.created, u.modified,
            u.login_last_success, u.login_last_failure, u.login_failed_count, u.password_reset_code,
            u.password_reset_date, u.email, r.name as group_name, u.unsubscribe_code
        FROM web."user" u
        LEFT JOIN web.group r ON u.group_id = r.id """


    @staticmethod
    def get_by_id(user_id):
        g.cursor.execute(UserMapper.sql + ' WHERE u.id = %(id)s;', {'id': user_id})
        return User(g.cursor.fetchone()) if g.cursor.rowcount == 1 else None

    @staticmethod
    def get_by_username(username):
        sql = UserMapper.sql + ' WHERE LOWER(u.username) = LOWER(%(username)s);'
        g.cursor.execute(sql, {'username': username})
        return User(g.cursor.fetchone()) if g.cursor.rowcount == 1 else None
