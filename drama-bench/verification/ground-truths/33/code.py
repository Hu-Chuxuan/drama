import pandas as pd

df = pd.read_csv('data.csv')

current_population = df.loc[df['Year'] == 2024, 'Current Population'].values[0]
projected_population = df.loc[df['Year'] == 2024, 'Projected Population'].values[0]

percentage_increase = ((projected_population - current_population) / current_population) * 100

claimed_increase = 2.02
is_claim_correct = abs(percentage_increase - claimed_increase) < 0.01 

print(f"Calculated Population Increase: {percentage_increase:.2f}%")
print(f"Is the claim correct? {is_claim_correct}")
