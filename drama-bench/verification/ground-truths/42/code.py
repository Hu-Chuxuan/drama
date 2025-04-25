import pandas as pd

df = pd.read_csv('data.csv')

elon_net_worth = df['Total Net Worth'][0] 

print(f"Elon Musk's net worth: ${elon_net_worth:,}")
