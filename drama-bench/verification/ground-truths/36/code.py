import pandas as pd

df = pd.read_csv('data.csv')


num_stations = df['Number of Established Federally Funded EV Stations'].iloc[0]

def validate_claim(expected_stations=37):
    if num_stations == expected_stations:
        print("Claim is VALID: 37 EV charging stations were established.")
    else:
        print(f"Claim is INVALID: Found {num_stations} stations instead of 37.")

validate_claim()
