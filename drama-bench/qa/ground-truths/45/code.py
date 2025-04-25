# Extract the number of cups for the 2022–23 year
cups_2022_23 = df[df["Year"] == "2022-23"]["Cups of brewed coffee"].iloc[0]

# Convert to integer for exact number
cups_exact = int(cups_2022_23)