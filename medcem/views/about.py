from flask import flash, g, render_template, request, session, url_for
from werkzeug.utils import redirect
from medcem import app


@app.route('/about')
def about():
     return render_template('about.html')
