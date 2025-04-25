import pandas as pd
df = pd.read_csv("data.csv")
median = df.loc[df["Type"] == "Median", "Income"].values[0]
claim = 181000

is_median = (claim > median * (2/3)) and (claim < median * 2)
print(is_median)