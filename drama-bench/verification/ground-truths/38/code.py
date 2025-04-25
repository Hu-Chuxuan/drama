import pandas as pd

df = pd.read_csv('data.csv')


acres_offered = df.iloc[0, 0] 

claimed_acres = 1402
if acres_offered == claimed_acres:
    print("Claim is VALID: 1402 acres were offered to the Trump Administration.")
else:
    print(f"Claim is INVALID: {acres_offered} acres were offered instead of 1402.")
