import pandas as pd
df = pd.read_csv("data.csv")
workers_lost = df.loc[df["Event"] == 'KXL pipeline stoppage']