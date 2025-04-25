import pandas as pd
df = pd.read_csv("data.csv")
df["Date"] = df["Date"].astype(str)
df["Federal employees"] = df["Federal employees"] * 1000
biden_start = df.loc[df["Date"] == "11/1/2020"]
biden_end = df.loc[df["Date"] == "11/1/2024"]
emp_end = biden_end["Federal employees"].values[0]
emp_start = biden_start["Federal employees"].values[0]
emp_start == 2.89