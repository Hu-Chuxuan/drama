# Filter for NSW (where Sydney is located)
nsw_df = df[df["State"] == "NSW"]

# Total NSW supply
total_nsw_supply = nsw_df["Supply"].sum()

# Total solar and wind supply in NSW
solar_wind_supply = nsw_df[nsw_df["Fuel Type"].isin(["Solar", "Wind"])]["Supply"].sum()

# Calculate the percentage from solar and wind
percentage_solar_wind = (solar_wind_supply / total_nsw_supply) * 100