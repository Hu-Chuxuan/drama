import pandas as pd

df = pd.read_csv("data.csv")
salary = (df[df["Type"] == "Compensation Actually Paid"]["PEO"]).values[0]
print(salary)