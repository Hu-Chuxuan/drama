import pandas as pd
import io

data = """Date, Maximum Potential Adjustment %, Adjustment (Dollars), Salary After Adjustment
January 2025, 3.8, 6600, 180600"""

df = pd.read_csv(io.StringIO(data))

max_adjustment = df['Adjustment (Dollars)'].max()

if max_adjustment <= 6600:
    print("The claim that the spending plan includes a maximum salary raise of up to $6600 is VALID.")
else:
    print("The claim that the spending plan includes a maximum salary raise of up to $6600 is INVALID.")
