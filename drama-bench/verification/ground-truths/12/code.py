import pandas as pd

df = pd.read_csv("data.csv")

number_immigrants = df.iloc[:, 1].sum()

print(number_immigrants)