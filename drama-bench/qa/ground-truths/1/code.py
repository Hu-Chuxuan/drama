# Sort by homelessness rate in descending order
df_sorted = df.sort_values(by="Homeless people per 10,000", ascending=False)

# Get the state with the highest homelessness rate
highest_homeless_state = df_sorted.iloc[0]["State"]
