import pandas as pd

df = pd.read_csv('data.csv')


trump_percentage = df[df['Candidate'] == 'Donald Trump']['Percentage of Popular Vote'].values[0]
harris_percentage = df[df['Candidate'] == 'Kamala Harris']['Percentage of Popular Vote'].values[0]


vote_difference = trump_percentage - harris_percentage


claim_valid = abs(vote_difference) >= 2.0

print(f"Donald Trump Popular Vote Percentage: {trump_percentage}%")
print(f"Kamala Harris Popular Vote Percentage: {harris_percentage}%")
print(f"Vote Difference: {vote_difference}%")
print(f"Claim Valid: {claim_valid}")
