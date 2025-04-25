import pandas as pd


df = pd.read_csv("data.csv")


pennsylvania_amish = df[df['State'] == 'Pennsylvania']['Number of Amish People'].values[0]


print(f"Amish Population in Pennsylvania: {pennsylvania_amish}")

claim = 180000
if pennsylvania_amish >= claim:
    print("The claim might be plausible, but it seems unlikely.")
else:
    print("The claim is significantly higher than the Amish population in Pennsylvania.")
