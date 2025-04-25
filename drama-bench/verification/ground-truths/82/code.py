# Sort the dataset by "Estimated Score" in descending order
df_sorted = df.sort_values(by="Estimated Score", ascending=False).reset_index(drop=True)

# Get the rank of the United States (1-based index)
usa_rank = df_sorted[df_sorted["Country"] == "United States"].index[0] + 1