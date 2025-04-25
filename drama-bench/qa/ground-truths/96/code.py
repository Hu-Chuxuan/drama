# Sum total shootings for each school level
totals = df[["Elementary schools", "Middle or junior high schools", "High schools or other schools ending in grade 12", "Other"]].sum()

# Find the category with the highest total
most_shootings_category = totals.idxmax()