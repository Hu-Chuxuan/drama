import pandas as pd
import numpy as np

df = pd.read_csv("data.csv", delimiter=' ')
df = df.replace('-', np.nan)
df = df.fillna(axis=1,method="ffill")
df["2022-23"] = df["2022-23"].astype(int)
print(df.sort_values(by="2022-23",ascending=False)["2022-23"])