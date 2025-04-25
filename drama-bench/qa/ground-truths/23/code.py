# Filter for June 2024
june_2024 = df[df["month"] == "6/1/24"]

# Calculate the percentage of foreign-born workers in the labor force
foreign_born = june_2024["Foreign-born labor force"].values[0]
native_born = june_2024["Native-born labor force"].values[0]
total = foreign_born + native_born
percentage = (foreign_born / total) * 100