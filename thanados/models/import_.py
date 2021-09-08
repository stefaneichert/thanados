from flask import g
from thanados import app
import pandas as pd
class Import_:

    @staticmethod
    def readCSV():
        data = pd.read_csv("thanados/static/import/test.csv")
        print(data['Name'])

