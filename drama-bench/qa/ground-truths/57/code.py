df.columns = df.columns.str.strip()

# Sort the DataFrame by 'Cost-of-living adjusted annual median wage' in descending order
sorted_df = df.sort_values(by='Cost-of-living adjusted annual median wage', ascending=False)

# Get the row with the second highest value
second_highest_adjusted = sorted_df.iloc[1]["Metro Area"]