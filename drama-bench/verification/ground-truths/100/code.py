# Load the dataset
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

# Filter for European countries
df_europe = df[df['Country Name'].isin(european_countries)]

# Sort by GDP in 2023 and get the rankings
df_europe_latest_sorted = df_europe[['Country Name', '2023']].sort_values(by='2023', ascending=False)

# Get GDP values for Russia, Germany, UK, and France
russia_gdp = df_europe_latest_sorted[df_europe_latest_sorted['Country Name'] == "Russian Federation"]['2023'].values[0]
germany_gdp = df_europe_latest_sorted[df_europe_latest_sorted['Country Name'] == "Germany"]['2023'].values[0]
uk_gdp = df_europe_latest_sorted[df_europe_latest_sorted['Country Name'] == "United Kingdom"]['2023'].values[0]
france_gdp = df_europe_latest_sorted[df_europe_latest_sorted['Country Name'] == "France"]['2023'].values[0]

# Check if Russia has surpassed Germany, the UK, and France
russia_vs_germany = russia_gdp > germany_gdp
russia_vs_uk = russia_gdp > uk_gdp
russia_vs_france = russia_gdp > france_gdp