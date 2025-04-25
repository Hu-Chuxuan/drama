import pandas as pd

df = pd.read_csv("data.csv")
unvaccinated_deaths = df[(df["Vaccination status"] == "Unvaccinated") & (df["Age group"].astype(str) == "10-14")]["Count of all cause deaths"].values[0]
vaccinated_deaths = df[(df["Vaccination status"] == "Third dose or booster, at least 21 days ago") & (df["Age group"].astype(str) == "10-14")]["Count of all cause deaths"].values[0]

print(unvaccinated_deaths)
print(vaccinated_deaths)