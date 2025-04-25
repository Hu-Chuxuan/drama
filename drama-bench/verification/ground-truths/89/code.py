import pandas as pd
df = pd.read_csv("data.csv")
china_2014 = df.loc[df["Country"] == "China", "2014 GDP"].values[0]
china_2023 = df.loc[df["Country"] == "China", "2023 GDP"].values[0]
india_2014 = df.loc[df["Country"] == "India", "2014 GDP"].values[0]
india_2023 = df.loc[df["Country"] == "India", "2023 GDP"].values[0]

print(china_2014, china_2023)
print(india_2014, india_2023)