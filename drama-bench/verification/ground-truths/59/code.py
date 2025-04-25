import pandas as pd
df = pd.read_csv('data.csv')
live_births = df[(df["Year"] == 2023) & (df["Month"] == "August")]["Number of Live Births"].values[0]
illegal_immigrants = df[(df["Year"] == 2023) & (df["Month"] == "August")]["Migrant Encounters"].values[0]