import pandas as pd

df = pd.read_csv('data.csv')  

total_funding = df['Total Funding/Grant Money'][0]
ev_stations = df['Number of Established Federally Funded EV Stations'][0]

claimed_funding = 7_500_000_000
claimed_ev_stations = 8

is_funding_correct = total_funding == claimed_funding
is_stations_correct = ev_stations == claimed_ev_stations

if is_funding_correct and is_stations_correct:
    print("The claim is correct.")
else:
    print("The claim is incorrect.")
    print(f"Actual Funding: ${total_funding:,}, Actual Stations: {ev_stations}")
