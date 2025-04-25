# Calculate total debt and percentage of foreign-owned debt
df["Total debt"] = df["Foreign-owned debt"] + df["Domestic debt"]
df["Foreign debt %"] = (df["Foreign-owned debt"] / df["Total debt"]) * 100

# Find the row with the maximum foreign debt percentage
max_row = df.loc[df["Foreign debt %"].idxmax()]["Date"]