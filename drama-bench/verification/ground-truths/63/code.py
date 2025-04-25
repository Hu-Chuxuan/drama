import pandas as pd
import numpy as np

df = pd.read_csv("data.csv", delimiter=' ')
# print(df)
tax = df[df["Metric"] == "Income tax expense"]["2023"].str.replace(r'[(),]', '', regex=True).astype(int).values[0]
tax_rate = tax / df[df["Metric"] == "Income before income taxes"]["2023"].str.replace(',','').astype(int).values[0]
print(tax)
print(tax_rate)