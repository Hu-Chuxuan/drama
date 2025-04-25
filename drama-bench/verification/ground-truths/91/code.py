import pandas as pd
df = pd.read_csv("data.csv")
terabytes = df.loc[df["Type"] == "Terabyte", "Quantity"].values[0]

is_4000T = terabytes == 4000

print(terabytes)
print(is_4000T)