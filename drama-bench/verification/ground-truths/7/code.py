import pandas as pd
df = pd.read_csv("data.csv")
work_year = df.loc[df["Year"] == 2023]
workers_in_office = 1 - work_year["Telework Daily"]