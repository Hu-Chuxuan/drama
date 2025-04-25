import pandas as pd
df = pd.read_csv("data.csv")
average = df["Adults who have 3 months emergency savings"].values.mean()
stat_2023 = df.loc[df["Year"] == 2023, "Adults who have 3 months emergency savings"].values[0]

print(average, stat_2023)