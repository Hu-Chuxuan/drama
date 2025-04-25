import pandas as pd

births_2023 = df[df["Metric"] == "Births"][2023].values[0]
births_2022 = df[df["Metric"] == "Births"][2022].values[0]
pct_change = (births_2023 - births_2022) / births_2022 * 100
print(pct_change)