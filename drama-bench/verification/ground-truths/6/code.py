import pandas as pd
df = pd.read_csv("data.csv")
voter_fraud_total = df.loc[df["Type"] == "Due to voter fraud", "Total"].values[0]
voter_fraud_republican = df.loc[df["Type"] == "Due to voter fraud", "Republican"].values[0]


# Calculate employment decrease
total_voter_fraud_true = voter_fraud_total == 30
republican_voter_fraud_true = voter_fraud_republican == 68
