# Calculate total imports
total_imports = df["Imports (bbl)"].sum()

# Get imports from Canada and Mexico
canada_imports = df[df["DW_NAME"] == "Canada"]["Imports (bbl)"].values[0]
mexico_imports = df[df["DW_NAME"] == "Mexico"]["Imports (bbl)"].values[0]

# Calculate percentage of total imports
canada_percentage = (canada_imports / total_imports) * 100
mexico_percentage = (mexico_imports / total_imports) * 100

res = canada_percentage + mexico_percentage