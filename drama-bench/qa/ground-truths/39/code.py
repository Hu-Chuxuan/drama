# Filter for the relevant procedure: pregnancy, childbirth & the puerperium
df_filtered = df[df["Diagnoses/Procedures"] == "14: Pregnancy, childbirth & the puerperium"]

# Get the 2000 and 2020 inflation-adjusted values
charges_2000 = df_filtered[df_filtered["Year"] == 2000]["Inflation-Adjusted Values"].values[0]
charges_2020 = df_filtered[df_filtered["Year"] == 2020]["Inflation-Adjusted Values"].values[0]

# Calculate how many times charges increased
increase_factor = charges_2020 / charges_2000