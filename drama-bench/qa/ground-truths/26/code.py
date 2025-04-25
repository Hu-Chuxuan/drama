# Calculate total employment
total_employment = df["Total"].sum()

# Filter relevant industries
selected_industries = [
    "Retail trade",
    "Education and health services",
    "Leisure and hospitality"
]

# Calculate total employment in selected industries
selected_total = df[df["Industry"].isin(selected_industries)]["Total"].sum()

# Calculate the percentage
percentage = (selected_total / total_employment) * 100