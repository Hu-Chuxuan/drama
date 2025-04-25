import pandas as pd

df = pd.read_csv('data.csv')
percentage_defense = df.loc[df["Category"] == "National Defense"]