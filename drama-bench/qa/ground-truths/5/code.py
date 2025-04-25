# Assuming the DataFrame is named `df`, find the state with the most affected birds

most_affected_state = df.loc[df["Birds Affected"].idxmax(), ["State Name"]]
