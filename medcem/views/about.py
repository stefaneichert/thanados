from flask import render_template

from medcem import app


@app.route('/about')
def about():
    return render_template('about.html')
