import pandas as pd

df = pd.read_csv('data.csv')
# Define European countries
european_countries = [
    "Albania", "Andorra", "Armenia", "Austria", "Azerbaijan", "Belarus", "Belgium", "Bosnia and Herzegovina",
    "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark", "Estonia", "Finland", "France", "Georgia", "Germany",
    "Greece", "Hungary", "Iceland", "Ireland", "Italy", "Kazakhstan", "Kosovo", "Latvia", "Liechtenstein",
    "Lithuania", "Luxembourg", "Malta", "Moldova", "Monaco", "Montenegro", "Netherlands", "North Macedonia",
    "Norway", "Poland", "Portugal", "Romania", "Russian Federation", "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain",
    "Sweden", "Switzerland", "Turkey", "Ukraine", "United Kingdom"
]

# Filter European countries
df_europe = df[df['Country Name'].isin(european_countries)]

# Sort by GDP in 2023 and get the top country in Europe
df_europe_latest_sorted = df_europe[['Country Name', '2023']].sort_values(by='2023', ascending=False)
top_europe_country = df_europe_latest_sorted.iloc[0]

# Define major global economies
major_economies = ["China", "United States", "India", "Japan", "Russian Federation"]

# Filter the dataset for global rankings
df_global_latest_sorted = df[['Country Name', '2023']].sort_values(by='2023', ascending=False)

# Get Russia's global ranking
russia_rank = df_global_latest_sorted[df_global_latest_sorted['Country Name'] == "Russian Federation"].index[0] + 1

# Check if Russia is #1 in Europe
is_russia_top_in_europe = top_europe_country['Country Name'] == "Russian Federation"

# Check if Russia is 5th in the world
is_russia_fifth_global = russia_rank == 5
