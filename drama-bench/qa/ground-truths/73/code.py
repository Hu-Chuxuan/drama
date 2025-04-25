# Convert Month column to datetime
df_wic["Month"] = pd.to_datetime(df_wic["Month"], format="%b-%y", errors="coerce")

# Convert WIC Participation column to numeric, handling commas
df_wic["WIC Participation"] = pd.to_numeric(df_wic["WIC Participation"].str.replace(",", ""), errors="coerce")

# Now extract July 2021 and October 2023
july_2021_value = df_wic[df_wic["Month"] == "2021-07-01"]["WIC Participation"].values[0]
oct_2023_value = df_wic[df_wic["Month"] == "2023-10-01"]["WIC Participation"].values[0]

# Calculate increase and percent increase
wic_increase = oct_2023_value - july_2021_value
wic_percent_increase = (wic_increase / july_2021_value) * 100