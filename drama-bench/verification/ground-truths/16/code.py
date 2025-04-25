import pandas as pd

df = pd.read_csv("data.csv")
avg_loyalty_rate = df["EV Loyalty Rate"].mean()
print(avg_loyalty_rate)