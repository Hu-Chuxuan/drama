# Extract values for 2020–21 and 2021–22
val_2020_21 = df[df["School year"] == "2020–21"]["Total school shootings"].values[0]
val_2021_22 = df[df["School year"] == "2021–22"]["Total school shootings"].values[0]

# Calculate percentage increase
percentage_increase = ((val_2021_22 - val_2020_21) / val_2020_21) * 100