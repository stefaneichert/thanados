from flask import render_template
from flask_login import current_user, login_required


from thanados import app


@app.route('/about')
@app.route('/about/<domain_>')
def about(domain_=None):

    domains = ['medcem', 'thanados']

    if str(domain_) in domains:
        return render_template('about/' + str(domain_) + '.html')
    return render_template('about/about.html')
