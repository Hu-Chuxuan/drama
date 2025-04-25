import pandas as pd
df = pd.read_csv("data.csv")
terabytes = df.loc[df["Type"] == "Terabyte", "Quantity"].values[0]

res = terabytes == 2