import pandas as pd

df = pd.read_csv("VSRR_Provisional_Drug_Overdose_Death_Counts.csv")

df["Data Value"] = df["Data Value"].str.replace(",", "")
df["Data Value"] = pd.to_numeric(df["Data Value"])
df = df[df["Indicator"] == "Synthetic opioids, excl. methadone (T40.4)"]
synthetic_opioids_avg_yearly_deaths = df.groupby(["Year", "Month"])["Data Value"].sum().mean()
print(synthetic_opioids_avg_yearly_deaths) # by average last 12 month data