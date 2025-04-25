import pandas as pd
df = pd.read_csv("data.csv")
black_women = df.loc[df["Gender"] == "Woman", "Black"].values[0]
total_shootings = df["Black"].sum() + df["Not Black"].sum()

ratio = black_women/total_shootings

print(black_women, total_shootings, ratio)