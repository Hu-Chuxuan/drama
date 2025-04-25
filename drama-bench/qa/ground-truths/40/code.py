# Filter counties with "Very High" risk rating
very_high_risk = df[df["RISK_RATNG"] == "Very High"]

# Sum the population in these counties
total_population_very_high_risk = very_high_risk["POPULATION"].sum()