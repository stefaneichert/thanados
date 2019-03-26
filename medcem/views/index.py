from flask import flash, g, render_template, request, session, url_for
from werkzeug.utils import redirect
from medcem import app


@app.route('/')
@app.route('/index')
def index():
     return render_template('index.html')
