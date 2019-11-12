from flask import render_template

from thanados import app


@app.route('/manual')
def manual():
    return render_template('manual/manual.html')
