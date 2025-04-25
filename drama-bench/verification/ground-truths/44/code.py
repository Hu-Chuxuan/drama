import pandas as pd


df = pd.read_csv("data.csv")


pennsylvania_amish = df[df['State'] == 'Pennsylvania']['Number of Amish People'].iloc[0]


claimed_number = 92600
valid = pennsylvania_amish == claimed_number

print(f"Claim: There are {claimed_number} Amish people in Pennsylvania.")
print(f"Actual: There are {pennsylvania_amish} Amish people in Pennsylvania.")
print(f"Claim is valid: {valid}")
