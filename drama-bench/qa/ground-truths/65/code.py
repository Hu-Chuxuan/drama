# Extract milk consumption values for 1975 and 2022
consumption_1975 = df[df["Year"] == 1975]["Per capita milk consumption, in cups per day"].values[0]
consumption_2022 = df[df["Year"] == 2022]["Per capita milk consumption, in cups per day"].values[0]

# Calculate percentage decrease
percentage_decrease = ((consumption_1975 - consumption_2022) / consumption_1975) * 100
