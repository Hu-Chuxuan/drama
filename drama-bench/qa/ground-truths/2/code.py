# Extract values for 2022 and 2024
homeless_2022 = df[df["Year"] == 2022]["Total"].values[0]
homeless_2024 = df[df["Year"] == 2024]["Total"].values[0]

# Calculate percentage increase from 2022 to 2024
percentage_increase = ((homeless_2024 - homeless_2022) / homeless_2022) * 100