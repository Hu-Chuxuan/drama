# Filter for years 1983 to 2023
cola_filtered = df[(df["Year"] >= 1983) & (df["Year"] <= 2023)]

# Find the year with the maximum COLA update
max_cola_year = cola_filtered.loc[cola_filtered["COLA update"].idxmax()]["Year"]