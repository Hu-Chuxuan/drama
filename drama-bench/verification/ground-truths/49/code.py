import pandas as pd
df = pd.read_csv("data.csv")
three_year_difference = df.loc[df["Year"] == 2024, "Samantha Powers Net Worth"].values[0] - \
                          df.loc[df["Year"] == 2021, "Samantha Powers Net Worth"].values[0]