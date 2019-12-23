import unittest

from flask import url_for

from thanados import app


class TestBaseCase(unittest.TestCase):

    def setUp(self):
        app.testing = True
        app.config['SERVER_NAME'] = 'local.host'
        app.config['WTF_CSRF_ENABLED'] = False
        app.config['WTF_CSRF_METHODS'] = []  # This is the magic to disable CSRF for tests
        self.app = app.test_client()


class WebsiteTests(TestBaseCase):

    def test_sites(self):
        with app.app_context():
            assert b'project' in self.app.get('/').data
            assert b'project' in self.app.get(url_for('about')).data
            assert b'Begin' in self.app.get(url_for('sites')).data
            assert b'Orientation' in self.app.get(url_for('charts')).data
            assert b'Filter' in self.app.get(url_for('manual')).data
            assert b'Password' in self.app.get(url_for('login')).data
            assert b'Visualisations' in self.app.get(url_for('map',object_id=50505)).data
            rv = self.app.get(url_for('entity_view', object_id=50505))
            assert b'cite' in rv.data
            rv = self.app.get(url_for('entity_view', object_id=50505, format_='json'))
            assert b'site' in rv.data
            self.app.get(url_for('admin'))
            assert b'Username:' in self.app.get(url_for('login')).data
            assert b'Username:' in self.app.get(url_for('logout'), follow_redirects=True).data
            rv = self.app.post(url_for('login'), data={'username': 'seppl', 'password': 'ninx'}, follow_redirects=True)
            assert b'error username' in rv.data
