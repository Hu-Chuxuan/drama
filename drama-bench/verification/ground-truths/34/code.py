import pandas as pd

df = pd.read_csv("data.csv") 

projected_population = df.loc[df['Year'] == 2024, 'Projected Population'].values[0]
current_population = df.loc[df['Year'] == 2024, 'Current Population'].values[0]


difference = projected_population - current_population


if abs(difference - 200000) <= 10000: 
    print(f"The claim is roughly correct. The shortfall is {difference}.")
else:
    print(f"The claim is inaccurate. The actual shortfall is {difference}.")