import pandas as pd
df = pd.read_csv("data.csv")
q4_5G_availability = df.loc[df["Quarter"] == "Q4", "5G Availability"].values[0]


print(q4_5G_availability)