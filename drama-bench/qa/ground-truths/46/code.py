# Extract values for 2021-22 and 2022-23 for utilized coffee production
coffee_2021_22 = df[df["Year"] == "2021-22"]["Coffee"].iloc[0]
coffee_2022_23 = df[df["Year"] == "2022-23"]["Coffee"].iloc[0]

# Calculate percentage decrease
percentage_decrease = ((coffee_2021_22 - coffee_2022_23) / coffee_2021_22) * 100