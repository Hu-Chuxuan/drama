import pandas as pd
df = pd.read_csv("data.csv")
employment_january = df.loc[df["Type"] == "Employment", "January"].values[0]
employment_february = df.loc[df["Type"] == "Employment", "February"].values[0]

# Calculate employment decrease
employment_decrease = employment_january - employment_february 