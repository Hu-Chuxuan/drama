import pandas as pd
df = pd.read_csv('data.csv')
pm25Values = df.loc[df['Year'] == 2024]['PM 2.5 Levels'][0]
pm25toCigarette = 22
cigarettesInhaled = pm25Values / pm25toCigarette