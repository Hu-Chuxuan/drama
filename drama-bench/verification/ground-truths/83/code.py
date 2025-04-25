import pandas as pd
df = pd.read_csv('data.csv')
country = df[df['educationRankingsByCountry_WT20rank2024'] == 1]['country'].values[0]