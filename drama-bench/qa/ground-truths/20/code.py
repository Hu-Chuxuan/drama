# Clean the 2023 column and convert it to numeric by removing $ and commas
df["2023"] = df["2023"].replace('[\$,]', '', regex=True).astype(float)

# Find the country with the highest export value in 2023
highest_export_2023 = df.loc[df["2023"].idxmax()]["Country"]
