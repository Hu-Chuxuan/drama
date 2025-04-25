import pandas as pd

df = pd.read_csv("API_IC.REG.DURS_DS2_en_csv_v2_1193.csv")
print(df[df["Country Name"] == "France"]["2019"].values[0]) # 2019 is the most recent year