import pandas as pd
df = pd.read_csv("data.csv")
work_year = df.loc[df["Year"] == 2023]
remote_workers = work_year["Telework Daily"]