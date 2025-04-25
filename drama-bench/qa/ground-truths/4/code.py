# Sort by visitor spending in descending order
df_sorted = df.sort_values(by="Visitor Spending", ascending=False)

# Get the park with the highest visitor spending
highest_spending_park = df_sorted.iloc[0]["Park Unit"]