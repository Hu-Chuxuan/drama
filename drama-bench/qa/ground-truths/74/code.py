# Get the number of active apprentices in 2008 and 2021
value_2008 = df_apprentice[df_apprentice["Fiscal Year"] == 2008]["Active Apprentices"].values[0]
value_2021 = df_apprentice[df_apprentice["Fiscal Year"] == 2021]["Active Apprentices"].values[0]

# Calculate increase and percentage increase
increase = value_2021 - value_2008
percent_increase = (increase / value_2008) * 100