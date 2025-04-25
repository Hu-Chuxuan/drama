# Convert 'Record Date' to datetime
df["Record Date"] = pd.to_datetime(df["Record Date"])

# Filter for rows in 2020
df_2020 = df[df["Record Date"].dt.year == 2020]

# Get the first and last entry of 2020
start_2020 = df_2020.sort_values("Record Date").iloc[0]["Total national debt"]
end_2020 = df_2020.sort_values("Record Date").iloc[-1]["Total national debt"]

# Calculate the change
debt_growth_2020 = end_2020 - start_2020