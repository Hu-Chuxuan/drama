import pandas as pd
df = pd.read_csv("data.csv")
voter_fraud_total = df.loc[df["Type"] == "Due to voter fraud", "Total"].values[0]


# Calculate employment decrease
total_voter_fraud_true = voter_fraud_total == 82
