# Calculate year-to-year difference in pounds
yearly_diff_pounds = df["Milk production in pounds"].diff().dropna()

# Compute average annual increase in pounds
avg_annual_increase_pounds = yearly_diff_pounds.mean()