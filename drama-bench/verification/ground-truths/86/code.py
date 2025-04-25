import pandas as pd
df = pd.read_csv("data.csv")
trump = df.loc[df["Year"] == 2018, "ICE Removals"].values[0] + df.loc[df["Year"] == 2019, "ICE Removals"].values[0]+df.loc[df["Year"] == 2020, "ICE Removals"].values[0]
biden = df.loc[df["Year"] == 2021, "ICE Removals"].values[0] + df.loc[df["Year"] == 2022, "ICE Removals"].values[0]+df.loc[df["Year"] == 2023, "ICE Removals"].values[0]

print(trump)
print(biden)
