from flask import render_template

from medcem import app


@app.route('/manual')
def manual():
    return render_template('manual.html')
