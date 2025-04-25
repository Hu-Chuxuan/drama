import pandas as pd
df = pd.read_csv('data.csv')

ireland_2018 = df[(df['Entity'] == 'Ireland') & (df['Year'] == 2018)]
calories_ireland_2018 = ireland_2018['Daily calorie supply per person'].values[0]