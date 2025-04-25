import pandas as pd

df = pd.read_csv('data.csv') 

total_acres = df['Number of Acres Offered to Trump Administration'].sum()

claim_acres = 355000
if total_acres == claim_acres:
    print("The claim is accurate.")
elif total_acres < claim_acres:
    print(f"The claim is an overstatement. Only {total_acres} acres were offered.")
else:
    print(f"The claim is an understatement. {total_acres} acres were actually offered.")
