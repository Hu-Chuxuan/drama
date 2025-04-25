import pandas as pd
df = pd.read_csv('data.csv')
top_1_percent_rate = df[df["Taxpayer Group"] == "Top 1%"]["Federal Income Tax Rate"].values[0]