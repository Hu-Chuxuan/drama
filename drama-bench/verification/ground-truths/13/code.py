import pandas as pd

df = pd.read_csv("data.csv")
amt_in_savings = df["Transaction accounts"].values[0] # in thousands
print(amt_in_savings)