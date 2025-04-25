import pandas as pd
df = pd.read_csv("data.csv")
viewers = df.loc[df["Year"] == 2024, "Number of Viewers"].values[0]


print(viewers)