from flask import render_template
from flask_login import current_user, login_required


from thanados import app


@app.route('/about')
@app.route('/about/<domain_>')
def about(domain_=None):

    if str(domain_) == 'medcem':
        return render_template('about/medcem.html')
    return render_template('about/about.html')
