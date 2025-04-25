import pandas as pd

df = pd.read_csv("data.csv")
eu_commitments = df[df["Country (group)"] == "EU members and institutions"]["Total bilateral commitments"].values[0]
us_commitments = df[df["Country (group)"] == "United States"]["Total bilateral commitments"].values[0]
print(eu_commitments)
print(us_commitments)