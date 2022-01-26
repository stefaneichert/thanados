from flask import render_template
from flask_login import current_user, login_required


from thanados import app


@app.route('/manual')
def manual():
    return render_template('manual/manual.html')
