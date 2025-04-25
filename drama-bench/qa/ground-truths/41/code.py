# Apply updated filtering logic
fuels_mask = df_clean["Category"].str.contains("Fuels", case=False, na=False)
vehicles_mask = df_clean["Category"] == "Gas and diesel motor vehicles"

# Combine filters and calculate target jobs
target_jobs = df_clean[fuels_mask | vehicles_mask]["Number of jobs (2022)"].sum()

# Recalculate the percentage
percentage = (target_jobs / total_jobs) * 100