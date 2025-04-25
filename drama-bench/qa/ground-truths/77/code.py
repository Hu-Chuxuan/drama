# Get earnings for Bachelor's degree and High school diploma
bachelors_earnings = df_earnings[df_earnings["Educational level"] == "Bachelor's degree"]["Median usual weekly earnings"].values[0]
highschool_earnings = df_earnings[df_earnings["Educational level"] == "High school diploma"]["Median usual weekly earnings"].values[0]

# Calculate percentage difference
percent_diff = ((bachelors_earnings - highschool_earnings) / highschool_earnings) * 100