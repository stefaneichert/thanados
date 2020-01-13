from flask import jsonify, request

from thanados import app


@app.route('/ajax/test', methods=['POST'])
def ajax_test() -> str:
    result = [1,43, int(request.form['param'])]
    return jsonify(result)