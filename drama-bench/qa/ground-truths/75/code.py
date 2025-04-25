# Calculate total economic contribution by year
df_space["Total"] = df_space.drop(columns="Year").sum(axis=1)

# Get total for 2012 and 2021
total_2012 = df_space[df_space["Year"] == 2012]["Total"].values[0]
total_2021 = df_space[df_space["Year"] == 2021]["Total"].values[0]

# Calculate increase and percentage increase
increase = total_2021 - total_2012
percent_increase = (increase / total_2012) * 100