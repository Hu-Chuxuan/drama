import pandas as pd

df = pd.read_csv("data.csv")


df['Rate'] = df['Rate'].str.rstrip('%').astype(float)


df_sorted = df.sort_values(by='Rate', ascending=False)

us_inflation = df[df['Country'] == 'US']['Rate'].iloc[0]
other_inflations = df[df['Country'] != 'US']['Rate']

us_inflation < other_inflations.max() 