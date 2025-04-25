import pandas as pd

df = pd.read_csv("Soros Fund Management LLC Q1 2024 vs. Q2 2024 13F Holdings Comparison.csv")


nvda = df[df["Sym"] == "NVDA"]

if nvda.empty:
    print("Soros Capital did not disclose a position in NVDA in either their 2024 Q1 or Q2 13F")
else:
    print("Soros Capital disclosed a position in NVDA in either their 2024 Q1 or Q2 13F")