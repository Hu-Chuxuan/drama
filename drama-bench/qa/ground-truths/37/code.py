# Filter for January 2019 and May 2024 complaints only
jan_2019_complaints = df[(df["Month"].dt.year == 2019) & (df["Month"].dt.month == 1)]["Complaints"].sum()
may_2024_complaints = df[(df["Month"].dt.year == 2024) & (df["Month"].dt.month == 5)]["Complaints"].sum()

# Calculate how many times it has increased
times_increased_jan_to_may = may_2024_complaints / jan_2019_complaints