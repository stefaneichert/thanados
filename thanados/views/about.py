from flask import render_template
from flask_login import current_user, login_required


from thanados import app


@app.route('/about')
@login_required
def about():
    return render_template('about/about.html')
